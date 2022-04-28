# Plaid Income Sample

Or "Todd tries to build a react app from scratch"

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app). There's probably some extra cruft I need to get rid of before I can distribute it. But it's a good start!

## Running the server

To get the server running...

- cd into the server directory and run `npm install`
- Copy over `.env_orig.env` to `.env`
- Copy over `user_data_orig.json` to `user_data.json`
- Add your client ID and secret to the .env file you just created
- Run `npm start` (or `npm run watch` if you want to make changes to the file)

In lieu of setting up an actual database to keep track of user info, we store everything to a flat JSON-encoded file (the user_data.json file). It's not very scalable, but it survives server restarts, which is nice.

## Running the client

To get the client running...

- cd into the client directory and run `npm install`
- run `npm start`. This will start React in development mode, with automatic reloading and all that fun stuff.

Go ahead and open up the client page in the browser if it doesn't open automatically (by default, this should be http://localhost:3000)

## Using the application

Would you like to be the first to own a pre-owned hoverboard? Well, you're in luck, Todd's Pre-Owned Hoverboards has financing available!

When you first start up the app, you'll be prompted to both connect to a bank to load up your liabilities, but also connect to your Payroll provider to load up your sources of income! (Once you've done that, we then provide you with the opportunity to add additional sources of income -- either from payroll or from the bank)

When asked to connect to a bank while in Sandbox mode, supply the credentials `user_good` and `pass_good` and the MFA code of `1234` if you're asked for it.

### TODOs

- See what happens if you provide existing access tokens when creating a link token for bank income
- Add error messaging somewhere in the app for if people forget to fill out the .env or fill it out incorrectly
- Make sure we don't flip out if you try to use Document Income in a non-Sandbox environment, before the data is ready.
- Add in the payroll income precheck
- Add a little more styling, maybe?
- Clean up my camel vs snake vs kebab case inconsistencies
- Maybe let you pick if you want to start with Bank Income instead of Payroll Income in the zero state
- Let you know if financing is available so we have a happy ending to our story.
