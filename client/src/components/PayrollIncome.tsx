import { useCallback, useContext, useEffect, useState } from "react";
import { UserContext } from "./UserContext";
import LinkLoader, { IncomeType } from "./LinkLoader";
import { Badge, Box, Flex, Heading, Spacer, VStack } from "@chakra-ui/layout";

interface PayrollData {
  employer: string;
  ytd_gross: number;
  ytd_net: number;
  pay_period_gross: number;
  pay_period_frequency: string;
  downloaded_from_provider: boolean;
  payroll_id: string;
}

const PayrollIncome = () => {
  const [payrollIncome, setPayrollIncome] = useState(Array<PayrollData>());
  const hardCodedCurrencyCode = "USD";
  const { user } = useContext(UserContext);

  const getIncome = useCallback(async () => {
    const response = await fetch("/appServer/getPayrollIncome");
    const data = await response.json();
    console.log("Payroll Income: ", data);
    const allPayrollIncome = data.items
      .reduce((prev: any, curr: any) => prev.concat(curr.payroll_income), [])
      .filter(
        (e: { pay_stubs: any[] | null }) =>
          e.pay_stubs != null && e.pay_stubs.length > 0
      );

    const thisUsersIncome: Array<PayrollData> = allPayrollIncome.map(
      (e: { pay_stubs: any[]; account_id?: string }) => {
        const pay_stub = e.pay_stubs[0];
        return {
          employer: pay_stub.employer.name,
          ytd_gross: pay_stub.earnings.total.ytd_amount,
          ytd_net: pay_stub.net_pay.ytd_amount,
          pay_period_gross: pay_stub.pay_period_details.gross_earnings,
          pay_period_frequency: pay_stub.pay_period_details.pay_frequency,
          downloaded_from_provider: e.account_id !== null,
          payroll_id: pay_stub.document_id,
        };
      }
    );
    setPayrollIncome(thisUsersIncome);
  }, []);

  useEffect(() => {
    getIncome();
  }, [getIncome, user.incomeConnected, user.incomeUpdateTime]);

  return (
    <Box minW="40vw">
      <VStack>
        <Heading as="h4" size="md">
          Payroll income
        </Heading>
        <p>
          <LinkLoader
            buttonText={"Add a payroll provider"}
            income={true}
            incomeType={IncomeType.Payroll}
          ></LinkLoader>
        </p>
        {payrollIncome.length === 0 ? (
          <p>
            Click the "Add payroll provider" button to import income from your
            employer (or scanned documents)
          </p>
        ) : (
          <Flex>
            {payrollIncome.map((payroll: PayrollData, idx) => (
              <Box
                key={payroll.payroll_id}
                maxW="xs"
                borderWidth="2px"
                borderRadius="lg"
                overflow="hidden"
                mx="2"
                px="3"
              >
                <Box mt="1" fontWeight="semibold" as="h4" isTruncated>
                  {payroll.employer}
                </Box>
                <Box fontSize="sm">
                  YTD:{" "}
                  {payroll.ytd_gross.toLocaleString("en-US", {
                    style: "currency",
                    currency: hardCodedCurrencyCode,
                  })}
                </Box>
                <Box fontSize="sm">
                  Net:{" "}
                  {payroll.ytd_net.toLocaleString("en-US", {
                    style: "currency",
                    currency: hardCodedCurrencyCode,
                  })}
                </Box>
                <Box fontSize="sm">
                  Salary:{" "}
                  {payroll.pay_period_gross.toLocaleString("en-US", {
                    style: "currency",
                    currency: hardCodedCurrencyCode,
                  })}{" "}
                  <Box as="span" fontSize="x-small">
                    {payroll.pay_period_frequency}
                  </Box>
                </Box>
                {payroll.downloaded_from_provider ? (
                  <Badge colorScheme="green">Downloaded</Badge>
                ) : (
                  <Badge colorScheme="yellow">Scanned</Badge>
                )}
              </Box>
            ))}
          </Flex>
        )}
      </VStack>
    </Box>
  );
};

export default PayrollIncome;
