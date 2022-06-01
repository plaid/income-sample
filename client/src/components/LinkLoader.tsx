import { useContext, useState } from "react";
import { UserContext, PlaidConnectStatus } from "./UserContext";
import LaunchLink from "./LinkLauncher";
import { Button } from "@chakra-ui/button";

export enum IncomeType {
  Bank = "bank",
  Payroll = "payroll",
}

interface Props {
  income: boolean;
  incomeType: IncomeType;
  buttonText: string;
}

/**
 * Grabs a link token from the server, calls Link, and then either sends the
 * public token back down to the server, or just reports success back ot the
 * sever. The behavior of this changes quite a bit depending on whether
 * or not you're using Plaid Income.
 */

const LinkLoader = (props: Props) => {
  const [linkToken, setLinkToken] = useState("");
  const { user, setUser } = useContext(UserContext);

  const loadAndLaunchLink = async () => {
    const linkToken = await fetchLinkToken();
    setLinkToken(linkToken);
  };

  const linkSuccess = async (public_token: String) => {
    if (public_token != null && public_token !== "") {
      if (props.income) {
        await incomeSuccess(public_token);
      } else {
        await accessTokenSuccess(public_token);
      }
    }
  };

  const incomeSuccess = async (public_token: String) => {
    const response = await fetch("/appServer/income_was_successful", {
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
  };

  const accessTokenSuccess = async (public_token: String) => {
    const response = await fetch("/appServer/swap_public_token", {
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

    const response = await fetch("/appServer/generate_link_token", {
      method: "POST",
      headers: { "Content-type": "application/json" },
      body: messageBody,
    });
    if (response.status === 500) {
      alert(
        "We received an error trying to create a link token. Please make sure you've followed all the setup steps in the readme file, and that your account is activated for income verification."
      );
    } else {
      const data = await response.json();

      console.log(`Got back link token ${data.link_token}`);
      return data.link_token;
    }
  };

  return (
    <>
      <Button colorScheme="green" onClick={() => loadAndLaunchLink()}>
        {props.buttonText}
      </Button>
      <LaunchLink token={linkToken} successCallback={linkSuccess} />
    </>
  );
};

LinkLoader.defaultProps = {
  income: false,
  incomeType: IncomeType.Payroll,
  buttonText: "Connect my bank",
};

export default LinkLoader;
