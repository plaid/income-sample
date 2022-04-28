import { useCallback, useEffect, useState } from "react";
import BankIncome from "./BankIncome";
import PayrollIncome from "./PayrollIncome";
import Liabilities from "./Liabilities";
import LinkLoader from "./LinkLoader";

enum PlaidConnectStatus {
  Unknown = "unknown",
  Connected = "connected",
  NotConnected = "notConnected",
}

const UserStatus = (props: { income: boolean }) => {
  const [connected, setConnected] = useState(PlaidConnectStatus.Unknown);

  const getInfo = useCallback(async () => {
    const url = `/appServer/getUserInfo${props.income ? "?income=true" : ""}`;
    const response = await fetch(url);
    const data = await response.json();
    console.log(data);
    if (data["status"]) {
      setConnected(PlaidConnectStatus.Connected);
    } else {
      setConnected(PlaidConnectStatus.NotConnected);
    }
    return data;
  }, [props.income]);

  const linkFinished = async (public_token: String) => {
    console.log("Here's your public token", public_token);
    if (public_token != null && public_token !== "") {
      if (props.income) {
        await reportThatIncomeWasGood();
      } else {
        await exchangeToken(public_token);
      }
    }
    await getInfo();
  };

  const reportThatIncomeWasGood = async () => {
    const response = await fetch("/appServer/incomeWasSuccessful", {
      method: "POST",
      headers: { "Content-type": "application/json" },
    });
    console.log(response);
  };

  const exchangeToken = async (public_token: String) => {
    const response = await fetch("/appServer/swapPublicToken", {
      method: "POST",
      headers: { "Content-type": "application/json" },
      body: JSON.stringify({
        public_token: public_token,
      }),
    });
    console.log(response);
  };

  useEffect(() => {
    if (connected === PlaidConnectStatus.Unknown) {
      getInfo();
    }
  }, [connected, getInfo]);

  return (
    <div id="userStatusDiv">
      {connected === PlaidConnectStatus.Unknown ? (
        <>
          <p>Getting connection status</p>
        </>
      ) : connected === PlaidConnectStatus.Connected ? (
        <div>
          {props.income ? (
            <>
              <PayrollIncome /> <BankIncome />
            </>
          ) : (
            <Liabilities />
          )}
        </div>
      ) : (
        <>
          <p>
            Connect to your bank to load up
            {props.income
              ? " your first source of income"
              : " your current loans"}
          </p>
          <LinkLoader
            buttonText={"Link an account!"}
            successCallback={linkFinished}
            income={props.income}
          ></LinkLoader>
        </>
      )}
    </div>
  );
};

UserStatus.defaultProps = {
  income: false,
};

export default UserStatus;
