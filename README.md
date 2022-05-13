# Plaid Income Sample

Or "Todd tries to build a react app from scratch".

## Running the server

To get the server running...

- cd into the server directory and run `npm install`
- Copy over `.env.template` to `.env`
- Copy over `user_data.json.template` to `user_data.json`
- Add your client ID and secret to the .env file you just created
- Run `npm start` (or `npm run watch` if you want to make changes to the file)

In lieu of setting up an actual database to keep track of user info, we store everything to a flat JSON-encoded file (the user_data.json file). It's not very scalable, but it survives server restarts, which is nice. If you do want to start "fresh" with a new user, stop the server, re-copy `user_data.json.template` to `user_data.json`, then restart the server.

## Running the client

To get the client running...

- cd into the client directory and run `npm install`
- run `npm start`. This will start React in development mode, with automatic reloading and all that fun stuff.

Go ahead and open up the client page in the browser if it doesn't open automatically (by default, this should be http://localhost:3000)

## Using the application

Would you like to be the first to own a pre-owned hoverboard? Well, you're in luck, Todd's Pre-Owned Hoverboards has financing available!

When you first start up the app, you'll be prompted to connect to a bank to load up your liabilities, and connect to your Payroll provider (or bank) to load up your sources of income! We provide you with the opportunity to add additional sources of income as well.

When asked to connect to a bank while in Sandbox mode, supply the credentials `user_good` and `pass_good` and the MFA code of `1234` if you're asked for it. In Sandbox mode, the only "income" that exists is the interest income on the Plaid Savings account. Payroll income is a little more exciting.

### TODOs

- Handle things more elegantly if the user_data.json file doesn't exist
- Clean up my Chakra UI components. I suspect things are messier than they should be.
- Add in the payroll income precheck
- Clean up my camel vs snake vs kebab case inconsistencies
- Display a more meaningful message for when you have pending document data
- Consider at least showing how you'd use a webhook for document flow
- Make the error messaging fancier than an alert box
- See what happens if you provide existing access tokens when creating a link token for bank income
- Let you know if financing is available so we have a happy ending to our story.
