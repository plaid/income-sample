import { useCallback, useContext, useEffect } from "react";
import BankIncome from "./BankIncome";
import PayrollIncome from "./PayrollIncome";
import Liabilities from "./Liabilities";
import LinkLoader from "./LinkLoader";
import { UserContext, PlaidConnectStatus } from "./UserContext";
const UserStatus = () => {
  const { user, setUser } = useContext(UserContext);

  const getInfo = useCallback(async () => {
    const url = "/appServer/getUserInfo";
    const response = await fetch(url);
    const data = await response.json();
    console.log(`Here's your user data`);
    console.log(data);
    const liabilityStatus = data["liability_status"]
      ? PlaidConnectStatus.Connected
      : PlaidConnectStatus.NotConnected;
    const incomeStatus = data["income_status"]
      ? PlaidConnectStatus.Connected
      : PlaidConnectStatus.NotConnected;

    setUser(
      Object.assign({}, user, {
        incomeConnected: incomeStatus,
        liabilitiesConnected: liabilityStatus,
      })
    );
  }, [setUser, user]);

  useEffect(() => {
    console.log(`Here's your user ${JSON.stringify(user)}`);
    if (
      user.incomeConnected === PlaidConnectStatus.Unknown ||
      user.liabilitiesConnected === PlaidConnectStatus.Unknown
    ) {
      getInfo();
    }
  }, [user, getInfo]);

  return (
    <div id="userStatusDiv">
      {user.liabilitiesConnected === PlaidConnectStatus.Unknown ? (
        <p>Getting connection status</p>
      ) : user.liabilitiesConnected === PlaidConnectStatus.Connected ? (
        <>
          <Liabilities />
        </>
      ) : (
        <>
          <p>Tell us a little about your current loans</p>
          <LinkLoader
            buttonText={"Link an account"}
            income={false}
          ></LinkLoader>
        </>
      )}

      {user.incomeConnected === PlaidConnectStatus.Unknown ? (
        <p>Getting income status</p>
      ) : user.incomeConnected === PlaidConnectStatus.Connected ? (
        <>
          <PayrollIncome /> <BankIncome />
        </>
      ) : (
        <>
          <p>Tell us about your sources of income!</p>
          <LinkLoader
            buttonText={"Link an account!"}
            income={true}
          ></LinkLoader>
        </>
      )}
    </div>
  );
};

export default UserStatus;
