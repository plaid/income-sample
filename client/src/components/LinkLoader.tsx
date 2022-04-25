import { useState } from "react";
import LaunchLink from "./LinkLauncher";

export enum IncomeType {
  Bank = "bank",
  Payroll = "payroll",
}

interface Props {
  income: boolean;
  incomeType: IncomeType;
  buttonText: string;
  successCallback: (_: string) => Promise<void>;
}
// TODO: This successCallback chaining makes me think I should use context or something

const LinkLoader = (props: Props) => {
  const [linkToken, setLinkToken] = useState("");

  const loadAndLaunchLink = async () => {
    const linkToken = await fetchLinkToken();
    setLinkToken(linkToken);
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
      <LaunchLink token={linkToken} successCallback={props.successCallback} />
    </>
  );
};

LinkLoader.defaultProps = {
  income: false,
  incomeType: IncomeType.Payroll,
  buttonText: "Connect my bank",
  successCallback: () => {},
};

export default LinkLoader;
