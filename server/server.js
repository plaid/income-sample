"use strict";
require("dotenv").config();
const fs = require("fs/promises");
const express = require("express");
const bodyParser = require("body-parser");
const { Configuration, PlaidEnvironments, PlaidApi } = require("plaid");
const e = require("express");
const { v4: uuidv4 } = require("uuid");

const APP_PORT = process.env.APP_PORT || 8080;
const USER_DATA_FILE = "user_data.json";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const server = app.listen(APP_PORT, function () {
  console.log(`Server is up and running at http://localhost:${APP_PORT}/`);
});

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

// Instead of using a database to store our user token, we're writing it
// to a flat file. Unlike our session storage solution, this survives restarting
// the server. Convenient for demo purposes, a terrible idea for a production
// app.

const getUserRecord = async function () {
  try {
    const userData = await fs.readFile(USER_DATA_FILE, {
      encoding: "utf8",
    });
    const userDataObj = await JSON.parse(userData);
    console.log(`Retrieved userData ${userData}`);
    return userDataObj;
  } catch (error) {
    // Might happen first time, since file doesn't exist
    console.log("Got an error", error);
    return null;
  }
};

const getUserAccessToken = async function () {
  const userRecord = await getUserRecord();
  return userRecord.accessToken;
};

const getIncomeConnected = async function () {
  const userRecord = await getUserRecord();
  return userRecord.incomeConnected;
};

const getIncomeUserToken = async function () {
  const userRecord = await getUserRecord();
  return userRecord.incomeUserToken;
};

const updateUserRecord = async function (key, val) {
  try {
    const userRecord = await getUserRecord();
    userRecord[key] = val;
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

const setUserAccessToken = async function (token) {
  updateUserRecord("accessToken", token);
};

const setIncomeConnected = async function (status) {
  updateUserRecord("incomeConnected", status);
};

const setUserIncomeToken = async function (token) {
  updateUserRecord("incomeUserToken", token);
};

const getLazyUserID = async function () {
  const userRecord = await getUserRecord();
  if (userRecord.userId != null && userRecord.userId !== "") {
    return userRecord.userId;
  } else {
    // Let's lazily instantiate it!
    const randomUserId = "user_" + uuidv4();
    updateUserRecord("userId", randomUserId);
    return randomUserId;
  }
};

// Checks whether or not the user has an access token for a financial
// institution
app.get("/appServer/getUserInfo", async (req, res, next) => {
  try {
    if (req.query.income) {
      const income_status = await getIncomeConnected();
      return income_status != null && income_status === true
        ? res.json({ status: true })
        : res.json({ status: false });
    } else {
      const user_token = await getUserAccessToken();
      return user_token != null && user_token !== ""
        ? res.json({ status: true })
        : res.json({ status: false });
    }
  } catch (error) {
    next(error);
  }
});

const linkTokenObject = {
  user: { client_user_id: "testUser" },
  client_name: "Todd's Hoverboards",
  language: "en",
  products: ["liabilities"],
  country_codes: ["US"],
};

const incomeTokenObject = {
  user: { client_user_id: "testUser" },
  client_name: "Todd's Hoverboards",
  language: "en",
  products: ["income_verification"],
  country_codes: ["US"],
  webhook: "https://webhook.site/80c7a80d-daa8-43d8-a657-ddf1d93eaeb5",
};

app.post("/appServer/generateLinkToken", async (req, res, next) => {
  try {
    let response;
    // TODO: Maybe change this so it's "payroll" or "bank""
    if (req.body.income === true) {
      const userToken = await fetchOrCreateUserToken();
      console.log(`User token returned: ${userToken}`);
      const income_verification_object =
        req.body.incomeType === "payroll"
          ? { income_source_types: ["payroll"] }
          : {
              income_source_types: ["bank"],
              bank_income: { days_requested: 60 },
            };

      const newIncomeTokenObject = {
        ...incomeTokenObject,
        user_token: userToken,
        income_verification: income_verification_object,
      };
      console.log(
        `Here's your token object: ${JSON.stringify(newIncomeTokenObject)}`
      );
      response = await plaidClient.linkTokenCreate(newIncomeTokenObject);
    } else {
      response = await plaidClient.linkTokenCreate(linkTokenObject);
    }
    res.json(response.data);
  } catch (error) {
    console.log(`Running into an error!`);
    next(error);
  }
});

app.post("/appServer/swapPublicToken", async (req, res, next) => {
  try {
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: req.body.public_token,
    });
    console.log(`You got back ${JSON.stringify(response.data)}`);
    setUserAccessToken(response.data.access_token);
    res.json({ status: "success" });
  } catch (error) {
    next(error);
  }
});

app.post("/appServer/incomeWasSuccessful", async (req, res, next) => {
  try {
    setIncomeConnected(true);
    res.json({ status: true });
  } catch (error) {
    next(error);
  }
});

app.get("/appServer/fetchLiabilities", async (req, res, next) => {
  try {
    const userToken = await getUserAccessToken();
    const response = await plaidClient.liabilitiesGet({
      access_token: userToken,
    });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

const fetchOrCreateUserToken = async () => {
  const incomeUserToken = await getIncomeUserToken();
  console.log(`Trying to fetch local user token. Got ${incomeUserToken}`);

  if (incomeUserToken == null || incomeUserToken === "") {
    // We're gonna need to generate one!
    const userId = await getLazyUserID();
    console.log(`Got a user ID of ${userId}`);
    const response = await plaidClient.userCreate({
      client_user_id: userId,
    });
    const newUserIncomeToken = response.data.user_token;
    console.log(`New user token is  ${newUserIncomeToken}`);
    // We'll save this because this only needs to be done once per user
    setUserIncomeToken(newUserIncomeToken);
    return newUserIncomeToken;
  } else {
    return incomeUserToken;
  }
};

app.get("/appServer/getPayrollIncome", async (req, res, next) => {
  try {
    const userIncomeToken = await getIncomeUserToken();
    const response = await plaidClient.creditPayrollIncomeGet({
      user_token: userIncomeToken,
    });

    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

app.get("/appServer/getBankIncome", async (req, res, next) => {
  try {
    const userIncomeToken = await getIncomeUserToken();
    const response = await plaidClient.creditBankIncomeGet({
      user_token: userIncomeToken,
      options: {
        count: 3,
      },
    });

    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

const errorHandler = function (err, req, res, next) {
  console.error(`Your error: ${JSON.stringify(err)}`);
  console.error(err);
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
