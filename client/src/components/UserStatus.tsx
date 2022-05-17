import { useCallback, useContext, useEffect } from "react";
import BankIncome from "./BankIncome";
import PayrollIncome from "./PayrollIncome";
import Liabilities from "./Liabilities";
import LinkLoader, { IncomeType } from "./LinkLoader";
import { UserContext, PlaidConnectStatus } from "./UserContext";
import { Flex, Heading, Spacer, VStack } from "@chakra-ui/layout";
import { Text } from "@chakra-ui/react";

/**
 * This object queries the server to find out if the user has connected their
 * bank or payroll provider with Plaid for either the Liabilities or Income
 * product and then displays either the proper component or a "Connect your
 * bank" kind of button
 */
const UserStatus = () => {
  const { user, setUser } = useContext(UserContext);

  const getInfo = useCallback(async () => {
    const url = "/appServer/get_user_info";
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
    <VStack mt={3} spacing={6}>
      {user.liabilitiesConnected === PlaidConnectStatus.Unknown ? (
        <Text fontSize="sm">Getting connection status</Text>
      ) : user.liabilitiesConnected === PlaidConnectStatus.Connected ? (
        <>
          <Liabilities />
        </>
      ) : (
        <>
          <Heading as="h4" size="md">
            Outstanding loans
          </Heading>
          <Text>Tell us a little about your current loans</Text>
          <LinkLoader
            buttonText={"Link an account"}
            income={false}
          ></LinkLoader>
        </>
      )}
      {user.incomeConnected === PlaidConnectStatus.Unknown ? (
        <Text fontSize="sm">Getting income status</Text>
      ) : user.incomeConnected === PlaidConnectStatus.Connected ? (
        <Flex p="6" direction={{ base: "column", md: "row" }}>
          <PayrollIncome />
          <Spacer />
          <BankIncome />
        </Flex>
      ) : (
        <>
          <Heading as="h4" size="md">
            Sources of Income
          </Heading>
          <p>Tell us about your sources of income!</p>
          <Flex direction={{ base: "column", md: "row" }} gap={5}>
            <LinkLoader
              buttonText={"Use payroll provider"}
              income={true}
              incomeType={IncomeType.Payroll}
            ></LinkLoader>
            <LinkLoader
              buttonText={"Connect to my bank"}
              income={true}
              incomeType={IncomeType.Bank}
            ></LinkLoader>
          </Flex>
        </>
      )}
    </VStack>
  );
};

export default UserStatus;
