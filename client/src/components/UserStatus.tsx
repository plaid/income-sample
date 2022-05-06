import { useCallback, useContext, useEffect } from "react";
import BankIncome from "./BankIncome";
import PayrollIncome from "./PayrollIncome";
import Liabilities from "./Liabilities";
import LinkLoader, { IncomeType } from "./LinkLoader";
import { UserContext, PlaidConnectStatus } from "./UserContext";
import { Box, Flex, Heading, Spacer, VStack } from "@chakra-ui/layout";
import { Text } from "@chakra-ui/react";
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
    <VStack mt="6">
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
        <Flex p="6">
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
        </>
      )}
    </VStack>
  );
};

export default UserStatus;
