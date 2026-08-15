"use strict";
require("dotenv").config();
const fs = require("fs/promises");
const express = require("express");
const bodyParser = require("body-parser");
const { Configuration, PlaidEnvironments, PlaidApi } = require("plaid");
const { v4: uuidv4 } = require("uuid");

const APP_PORT = process.env.APP_PORT || 8080;
const USER_DATA_FILE = "user_data.json";

// Fields used for the userRecord object
const FIELD_ACCESS_TOKEN = "accessToken";
const FIELD_PLAID_USER_ID = "plaidUserId";
const FIELD_INCOME_CONNECTED = "incomeConnected";
const FIELD_USER_ID = "userId";

let webhookUrl =
  process.env.WEBHOOK_URL || "https://www.example.com/server/receive_webhook";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Set up the Plaid client
const plaidConfig = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": process.env.PLAID_SECRET,
      "Plaid-Version": "2020-09-14",
    },
  },
});

const plaidClient = new PlaidApi(plaidConfig);

/**
 * Extracts the useful, loggable part of an error. Axios attaches a `config`
 * object to its errors that contains the outgoing request headers -- including
 * our PLAID-SECRET -- so we never log one of those wholesale.
 * @param {Error} error
 * @returns {Object | string | Error} something safe to log
 */
const describeError = function (error) {
  if (error.response?.data != null) {
    // Plaid tells us what went wrong in the response body
    return error.response.data;
  }
  return error.isAxiosError ? error.message : error;
};

// Instead of using a database to store our user's Plaid ID, we're writing it
// to a flat file. Convenient for demo purposes, a terrible idea for a production
// app.

/**
 * Retrieve our user record from our  our flat file
 * @returns {Object} userDataObject
 */
const getUserRecord = async function () {
  try {
    const userData = await fs.readFile(USER_DATA_FILE, {
      encoding: "utf8",
    });
    const userDataObj = await JSON.parse(userData);
    console.log(`Retrieved userData ${userData}`);
    return userDataObj;
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log("No user object found. We'll make one from scratch.");
      return null;
    }
    // Might happen first time, if file doesn't exist
    console.log("Got an error", error);
    return null;
  }
};

/**
 * This loads our user record into memory when we first start up
 */
let userRecord;
(async () => {
  userRecord = await getUserRecord();
  if (userRecord == null) {
    userRecord = {};
    userRecord[FIELD_ACCESS_TOKEN] = null;
    userRecord[FIELD_INCOME_CONNECTED] = false;
    userRecord[FIELD_PLAID_USER_ID] = null;
    userRecord[FIELD_USER_ID] = null;
  }
  // Let's make sure we have a Plaid user created at startup
  try {
    await fetchOrCreatePlaidUserId();
  } catch (error) {
    console.error(
      "Couldn't create a Plaid user at startup. Double-check your PLAID_CLIENT_ID / PLAID_SECRET.",
      describeError(error)
    );
  }
  // Start listening only once userRecord is populated, so we never handle a
  // request against an undefined userRecord.
  app.listen(APP_PORT, function () {
    console.log(`Server is up and running at http://localhost:${APP_PORT}/`);
  });
})();

/**
 * Updates the user record in memory and writes it to a file. In a real
 * application, you'd be writing to a database.
 * @param {string} key
 * @param {string | number} val
 */
const updateUserRecord = async function (key, val) {
  userRecord[key] = val;
  try {
    const dataToWrite = JSON.stringify(userRecord);
    await fs.writeFile(USER_DATA_FILE, dataToWrite, {
      encoding: "utf8",
      mode: 0o600,
    });
    console.log(`User record ${dataToWrite} written to file.`);
  } catch (error) {
    console.log("Got an error: ", error);
  }
};

/**
 * Returns the userID associated with this user, or lazily instantiates one.
 * In a real application, this would most likely be your signed-in user's ID.
 * @returns {string} randomUserId
 */
const getLazyUserID = async function () {
  if (userRecord.userId != null && userRecord.userId !== "") {
    return userRecord.userId;
  } else {
    // Let's lazily instantiate it!
    const randomUserId = "user_" + uuidv4();
    await updateUserRecord(FIELD_USER_ID, randomUserId);
    return randomUserId;
  }
};

/**
 * Checks whether or not a user has granted access to liability info and income
 * info based on what's been recorded in our userRecord
 */
app.get("/appServer/get_user_info", async (req, res, next) => {
  try {
    const income_status =
      userRecord[FIELD_INCOME_CONNECTED] != null &&
      userRecord[FIELD_INCOME_CONNECTED] !== false;
    const liability_status =
      userRecord[FIELD_ACCESS_TOKEN] != null &&
      userRecord[FIELD_ACCESS_TOKEN] !== "";
    res.json({
      liability_status: liability_status,
      income_status: income_status,
    });
  } catch (error) {
    next(error);
  }
});

const basicLinkTokenObject = {
  client_name: "Todd's Hoverboards",
  language: "en",
  products: [],
  country_codes: ["US"],
};

/**
 * Generates a link token to be used by the client. Depending on the req.body,
 * this will either be a link token used for income, or one used for liabilities
 */
app.post("/appServer/generate_link_token", async (req, res, next) => {
  try {
    let response;
    if (req.body.income === true) {
      const plaidUserId = await fetchOrCreatePlaidUserId();
      console.log(`Plaid user ID returned: ${plaidUserId}`);
      const income_verification_object =
        req.body.incomeType === "payroll"
          ? { income_source_types: ["payroll"] }
          : {
              income_source_types: ["bank"],
              bank_income: { days_requested: 60 },
            };

      // With the New User APIs, the user_id returned by /user/create replaces
      // both the legacy user_token and the `user` object for user-based
      // products like Income.
      const newIncomeTokenObject = {
        ...basicLinkTokenObject,
        products: ["income_verification"],
        user_id: plaidUserId,
        webhook: webhookUrl,
        income_verification: income_verification_object,
      };
      console.log(
        `Here's your token object: ${JSON.stringify(newIncomeTokenObject)}`
      );
      response = await plaidClient.linkTokenCreate(newIncomeTokenObject);
    } else {
      // Liabilities isn't a user-based product, so this Link token still
      // identifies the end user with the `user` object.
      const newLiabilitiesTokenObject = {
        ...basicLinkTokenObject,
        user: { client_user_id: await getLazyUserID() },
        products: ["liabilities"],
        webhook: webhookUrl,
      };
      response = await plaidClient.linkTokenCreate(newLiabilitiesTokenObject);
    }
    res.json(response.data);
  } catch (error) {
    console.log(`Running into an error!`);
    next(error);
  }
});

/**
 * Swap the public token for an access token, so we can access liability info
 * in the future
 */
app.post("/appServer/swap_public_token", async (req, res, next) => {
  try {
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: req.body.public_token,
    });
    console.log(`You got back ${JSON.stringify(response.data)}`);
    await updateUserRecord(FIELD_ACCESS_TOKEN, response.data.access_token);
    res.json({ status: "success" });
  } catch (error) {
    next(error);
  }
});

/**
 * Just note that we've successfully connected to at least one source of income.
 */
app.post("/appServer/income_was_successful", async (req, res, next) => {
  try {
    await updateUserRecord(FIELD_INCOME_CONNECTED, true);
    res.json({ status: true });
  } catch (error) {
    next(error);
  }
});

/**
 * Grabs liability info for the user and return it as a big ol' JSON object
 */
app.get("/appServer/fetch_liabilities", async (req, res, next) => {
  try {
    const response = await plaidClient.liabilitiesGet({
      access_token: userRecord[FIELD_ACCESS_TOKEN],
    });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

/**
 * Returns the Plaid user_id if one exists, or calls the /user/create endpoint
 * to generate one and then return it.
 *
 * Under the New User APIs, /user/create returns a single `user_id` rather than
 * a `user_token`. That user_id is the identifier you pass to Link and to every
 * Income endpoint, and it's also what Plaid sends back on user-based webhooks.
 * Setting `with_upgraded_user` opts integrations that predate December 10, 2025
 * into the new behavior.
 *
 * Newly created users get a `usr_`-prefixed ID. Users you created before
 * migrating keep their existing identifier, so don't assume the prefix.
 *
 * In this application, we call this on demand. If you wanted to create this
 * user as soon as a user signs up for an account, that would be a perfectly
 * reasonable solution, as well.
 *
 * @returns {string} plaidUserId The Plaid user ID
 */
const fetchOrCreatePlaidUserId = async () => {
  const plaidUserId = userRecord[FIELD_PLAID_USER_ID];

  if (plaidUserId == null || plaidUserId === "") {
    // We're gonna need to generate one!
    const userId = await getLazyUserID();
    console.log(`Got a client user ID of ${userId}`);
    // /user/create is idempotent, so calling it again with a client_user_id
    // we've already used returns the existing user rather than erroring.
    const response = await plaidClient.userCreate({
      client_user_id: userId,
      with_upgraded_user: true,
    });
    console.log(`New Plaid user is ${JSON.stringify(response.data)}`);
    const newPlaidUserId = response.data.user_id;
    await updateUserRecord(FIELD_PLAID_USER_ID, newPlaidUserId);
    return newPlaidUserId;
  } else {
    return plaidUserId;
  }
};

/**
 * Return payroll income for the user, either downloaded from their payroll
 * provider, or scanned in from documents
 */
app.get("/appServer/get_payroll_income", async (req, res, next) => {
  try {
    const response = await plaidClient.creditPayrollIncomeGet({
      user_id: userRecord[FIELD_PLAID_USER_ID],
    });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

/**
 * Return income for the user, as inferred from their bank transactions.
 */
app.get("/appServer/get_bank_income", async (req, res, next) => {
  try {
    const response = await plaidClient.creditBankIncomeGet({
      user_id: userRecord[FIELD_PLAID_USER_ID],
      options: {
        count: 3,
      },
    });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

/**
 * A method for updating our item's webhook URL. For the purpose of Income,
 * what's really important is that we're updating the variable in memory that
 * we use to generate a Link Token. But it's good form to also update
 * any webhooks stored with any access tokens we're actively using, because
 * those items will still be pointing to the old (and probably invalid) webhook
 * location.
 */
app.post("/server/update_webhook", async (req, res, next) => {
  try {
    console.log(`Update our webhook with ${JSON.stringify(req.body)}`);
    // Update the one we have in memory
    webhookUrl = req.body.newUrl;
    const access_token = userRecord[FIELD_ACCESS_TOKEN];
    const updateResponse = await plaidClient.itemWebhookUpdate({
      access_token: access_token,
      webhook: req.body.newUrl,
    });
    res.json(updateResponse.data);
  } catch (error) {
    next(error);
  }
});

const errorHandler = function (err, req, res, next) {
  console.error("Your error:", describeError(err));
  if (err.response?.data != null) {
    res.status(500).send(err.response.data);
  } else {
    res.status(500).send({
      error_code: "OTHER_ERROR",
      error_message: "I got some other message on the server.",
    });
  }
};
app.use(errorHandler);

/**
 * For development purposes, we're running a second server on port 8001 that's
 * used to receive webhooks. This is so we can easily expose this endpoint to
 * the external world using ngrok without exposing the rest of our application.
 * See this tutorial for more details on using ngrok and webhooks:
 * https://www.youtube.com/watch?v=0E0KEAVeDyc
 */

const WEBHOOK_PORT = process.env.WEBHOOK_PORT || 8001;

const webhookApp = express();
webhookApp.use(bodyParser.urlencoded({ extended: false }));
webhookApp.use(bodyParser.json());

const webhookServer = webhookApp.listen(WEBHOOK_PORT, function () {
  console.log(
    `Webhook receiver is up and running at http://localhost:${WEBHOOK_PORT}/`
  );
});

webhookApp.post("/server/receive_webhook", async (req, res, next) => {
  try {
    console.log("Webhook received:");
    console.dir(req.body, { colors: true, depth: null });

    // TODO: Verify webhook.
    const product = req.body.webhook_type;
    const code = req.body.webhook_code;
    switch (product) {
      case "ITEM":
        handleItemWebhook(code, req.body);
        break;
      case "INCOME":
        handleIncomeWebhook(code, req.body);
        break;
      default:
        console.log(`Can't handle webhook product ${product}`);
        break;
    }
    res.json({ status: "received" });
  } catch (error) {
    next(error);
  }
});

function handleIncomeWebhook(code, requestBody) {
  switch (code) {
    // Under the New User APIs, this webhook was renamed from
    // INCOME_VERIFICATION, and its user_id is the same identifier returned by
    // /user/create.
    case "USER_INCOME_VERIFICATION":
      const verificationStatus = requestBody.verification_status;
      const plaidUserId = requestBody.user_id;
      if (verificationStatus === "VERIFICATION_STATUS_PROCESSING_COMPLETE") {
        console.log(
          `Plaid has successfully completed payroll processing for the user with the Plaid user ID of ${plaidUserId}. You should probably call /paystubs/get to refresh your data.`
        );
      } else if (
        verificationStatus === "VERIFICATION_STATUS_PROCESSING_FAILED"
      ) {
        console.log(
          `Plaid had trouble processing documents for the user with the Plaid user ID of ${plaidUserId}. You should ask them to try again.`
        );
      } else if (
        verificationStatus === "VERIFICATION_STATUS_PENDING_APPROVAL"
      ) {
        console.log(
          `Plaid is waiting for the user with the Plaid user ID of ${plaidUserId} to approve their income verification.`
        );
      }
      break;
    // The legacy version of the webhook above. Integrations created under the
    // New User APIs never receive it. If you're migrating, Plaid sends both
    // versions in parallel -- handle one or the other, or you'll process every
    // event twice.
    case "INCOME_VERIFICATION":
      break;
    default:
      console.log(`Can't handle webhook code ${code}`);
      break;
  }
}

function handleItemWebhook(code, requestBody) {
  switch (code) {
    case "ERROR":
      console.log(
        `I received this error: ${requestBody.error.error_message}| should probably ask this user to connect to their bank`
      );
      break;
    case "NEW_ACCOUNTS_AVAILABLE":
      console.log(
        `There are new accounts available at this Financial Institution! (Id: ${requestBody.item_id}) We might want to ask the user to share them with us`
      );
      break;
    case "PENDING_EXPIRATION":
      console.log(
        `We should tell our user to reconnect their bank with Plaid so there's no disruption to their service`
      );
      break;
    case "USER_PERMISSION_REVOKED":
      console.log(
        `The user revoked access to this item. We should remove it from our records`
      );
      break;
    case "WEBHOOK_UPDATE_ACKNOWLEDGED":
      console.log(`Future webhooks will be sent to this endpoint.`);
      break;
    default:
      console.log(`Can't handle webhook code ${code}`);
      break;
  }
}
