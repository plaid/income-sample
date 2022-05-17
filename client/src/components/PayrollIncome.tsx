import { useCallback, useContext, useEffect, useState } from "react";
import { UserContext } from "./UserContext";
import LinkLoader, { IncomeType } from "./LinkLoader";
import { Badge, Box, Flex, Heading, VStack } from "@chakra-ui/layout";

interface PayrollData {
  employer: string;
  ytd_gross: number;
  ytd_net: number;
  pay_period_gross: number;
  pay_period_frequency: string;
  downloaded_from_provider: boolean;
  payroll_id: string;
}

/**
 * Retrieve payroll income, either downloaded directly from the payroll provider
 * or scanned in from documents, and display them in a user-friendly way.
 */
const PayrollIncome = () => {
  const [payrollIncome, setPayrollIncome] = useState(Array<PayrollData>());
  const hardCodedCurrencyCode = "USD";
  const { user } = useContext(UserContext);

  const getIncome = useCallback(async () => {
    const response = await fetch("/appServer/get_payroll_income");
    const data = await response.json();
    console.log("Payroll Income: ", data);
    // `items` is an array of objects, each of which contains an array of
    // `payroll` income objects, each of which contains an array of `pay_stubs`
    const allPayrollIncome = data.items
      .filter(
        (item: any) => item.status.processing_status === "PROCESSING_COMPLETE"
      )
      .reduce((prev: any, curr: any) => prev.concat(curr.payroll_income), [])
      .filter(
        (e: { pay_stubs: any[] | null }) =>
          e.pay_stubs != null && e.pay_stubs.length > 0
      );

    const thisUsersIncome: Array<PayrollData> = allPayrollIncome.map(
      (e: { pay_stubs: any[]; account_id?: string }) => {
        // I'm only looking at our most recent pay stub but you may want to look
        // at several, depending on your use case
        const pay_stub = e.pay_stubs[0];
        // We need to be defensive here because an improperly scanned document
        // will show up with a lot of these values as undefined
        return {
          employer: pay_stub.employer.name || "Unknown",
          ytd_gross: pay_stub.earnings.total.ytd_amount || 0,
          ytd_net: pay_stub.net_pay.ytd_amount || 0,
          pay_period_gross: pay_stub.pay_period_details.gross_earnings || 0,
          pay_period_frequency:
            pay_stub.pay_period_details.pay_frequency || "Unknown",
          downloaded_from_provider: e.account_id !== null,
          payroll_id: pay_stub.document_id || "",
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
        {payrollIncome.length !== 0 && (
          <Flex direction={{ base: "column", lg: "row" }} gap={2}>
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
