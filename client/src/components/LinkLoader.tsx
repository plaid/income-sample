import { useContext, useState } from "react";
import { UserContext, PlaidConnectStatus } from "./UserContext";
import LaunchLink from "./LinkLauncher";

export enum IncomeType {
  Bank = "bank",
  Payroll = "payroll",
}

interface Props {
  income: boolean;
  incomeType: IncomeType;
  buttonText: string;
}

const LinkLoader = (props: Props) => {
  const [linkToken, setLinkToken] = useState("");
  const { user, setUser } = useContext(UserContext);

  const loadAndLaunchLink = async () => {
    const linkToken = await fetchLinkToken();
    setLinkToken(linkToken);
  };

  const incomeSuccess = async (public_token: String) => {
    if (public_token != null && public_token !== "") {
      const response = await fetch("/appServer/incomeWasSuccessful", {
        method: "POST",
        headers: { "Content-type": "application/json" },
      });
      console.log(response);
      setUser(
        Object.assign({}, user, {
          incomeConnected: PlaidConnectStatus.Connected,
          incomeUpdateTime: Date.now(),
        })
      );
    }
  };

  const linkSuccess = async (public_token: String) => {
    if (public_token != null && public_token !== "") {
      const response = await fetch("/appServer/swapPublicToken", {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({
          public_token: public_token,
        }),
      });
      console.log(response);
      setUser(
        Object.assign({}, user, {
          liabilitiesConnected: PlaidConnectStatus.Connected,
        })
      );
    }
  };

  const fetchLinkToken = async () => {
    const messageBody = props.income
      ? JSON.stringify({
          income: true,
          incomeType: props.incomeType,
        })
      : JSON.stringify({
          income: false,
        });
    const response = await fetch("/appServer/generateLinkToken", {
      method: "POST",
      headers: { "Content-type": "application/json" },
      body: messageBody,
    });
    const data = await response.json();
    console.log(`Got back link token ${data.link_token}`);
    return data.link_token;
  };

  return (
    <>
      <button onClick={() => loadAndLaunchLink()}>{props.buttonText}</button>
      <LaunchLink
        token={linkToken}
        successCallback={props.income ? incomeSuccess : linkSuccess}
      />
    </>
  );
};

LinkLoader.defaultProps = {
  income: false,
  incomeType: IncomeType.Payroll,
  buttonText: "Connect my bank",
};

export default LinkLoader;
