# Plaid Income Sample

This is a fairly simple application using React on the frontend, NodeJS on the backend and a text file as our database which demonstrates how to make calls against the Plaid Income API.

## Running the server

To get the server running...

- cd into the server directory and run `npm install`
- Copy over `.env.template` to `.env`
- Copy over `user_data.json.template` to `user_data.json`
- Add your client ID and secret to the .env file you just created
- Run `npm start` (or `npm run watch` if you want to make changes to the file)

In lieu of setting up an actual database to keep track of user info, we store everything to a flat JSON-encoded file (the `user_data.json` file). It's not very scalable, but it survives server restarts, which is nice. If you do want to start "fresh" with a new user, stop the server, re-copy `user_data.json.template` to `user_data.json`, then restart the server.

## Running the client

To get the client running...

- cd into the client directory and run `npm install`
- run `npm start`. This will start React in development mode, with automatic reloading and all that fun stuff.

Go ahead and open up the client page in the browser if it doesn't open automatically (by default, this should be http://localhost:3000)

## Using the application

Would you like to be the first to own a pre-owned hoverboard? Well, you're in luck, Todd's Pre-Owned Hoverboards has financing available!

When you first start up the app, you'll be prompted to connect to a bank to load up your liabilities, and connect to your Payroll provider (or bank) to load up your sources of income! We provide you with the opportunity to add additional sources of income as well.

When asked to connect to a bank while in Sandbox mode, supply the credentials **`user_bank_income`** and **`{}`** and the MFA code of `1234` if you're asked for it. This is different from the credentials you will be shown at the bottom of the page! While the `user_good` / `pass_good` credentials will work, they won't have much in the way of income streams associated with them. For more test accounts that work great with Income, see the [docs](https://plaid.com/docs/sandbox/test-credentials/#credit-and-income-testing-credentials).

In the debug panel (the little accordion component at the bottom of the screen) is a button that simulates what the Income flow might look like if you were to run an income pre-check call with an employer that results in a "HIGH" confidence level. This call only works in Sandbox mode.

## (Optional) Receiving webhooks

When you're developing in the Sandbox environment, Document Income data is available almost immediately. In Production, however, it may take several minutes for Document Income data to be complete. In those situations, you want to listen for the [`INCOME_VERIFICATION`](https://plaid.com/docs/api/products/income/#income_verification) webhook to know when it's safe to fetch document data.

In our sample application, we have set up a second server on port 8001 to listen for webhooks. If you want to expose this port to the outside world so it can receive webhooks from Plaid, you might want to use a tool like ngrok to create a tunnel between the outside world and localhost:8001. If you have ngrok installed, you can do this by running the following command:

```
ngrok http 8001
```

Once you've done this, you'll need to tell the sample app about the location of your webhook. You can do this by copying the domain that ngrok sets up into your .env file as the WEBHOOK_URL entry. Don't forget the `/server/receive_webhook` path at the end!

```
WEBHOOK_URL=https://1234-56-789-123-456.ngrok.io/server/receive_webhook/
```

It's best to do this before you start up the server, but you can also submit the new webhook URL into the debug panel (the little accordion component at the bottom of the browser screen) and that will also change the location of the webhook for all future calls.

For more information on Plaid webhooks, check out our [documentation](https://plaid.com/docs/api/webhooks/) or you can refer to our [video tutorial](https://www.youtube.com/watch?v=0E0KEAVeDyc).

### TODOs

- Display a more meaningful message for when you have pending document data
- Clean up some of the Chakra UI components a bit
- Make the error messaging fancier than an alert box
- Let you know if financing is available so we have a happy ending to our story.
- (Maybe) Add Socket.io support so our server can tell our client when to fetch document data
