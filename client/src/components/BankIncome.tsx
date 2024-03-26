import { useCallback, useContext, useEffect, useState } from "react";
import { UserContext } from "./UserContext";
import LinkLoader, { IncomeType } from "./LinkLoader";
import { Box, Flex, Heading, VStack } from "@chakra-ui/layout";

interface BankData {
  bank_name: string;
  total_amount: number;
  transaction_count: number;
  description: number;
  income_id: string;
}

/**
 * Retrieves any income data form the user's bank and displays it in a
 * somewhat user-friendly format
 */
const BankIncome = () => {
  const [bankIncome, setBankIncome] = useState(Array<BankData>());
  const hardCodedCurrencyCode = "USD";
  const { user } = useContext(UserContext);

  const getIncome = useCallback(async () => {
    const response = await fetch("/appServer/get_bank_income");
    const data = await response.json();
    console.log("Bank Income: ", data);

    type BankItemType = {
      institution_name: string;
      bank_income_sources: {
        total_amount: number;
        transaction_count: number;
        income_description: number;
        income_source_id: string;
      }[];
    };

    type BankIncomeType = {
      items: BankItemType[];
    };

    // `bank_income` is an array of objects, each of which contains an array of
    // `items`, which are objects that, in turn, contains an array of
    // `bank_income_sources`.
    const thisUsersIncome: Array<BankData> =
      data.bank_income?.flatMap((report: BankIncomeType) => {
        return report.items.flatMap((item) => {
          const institution_name = item.institution_name;
          const income_sources: Array<BankData> = item.bank_income_sources.map(
            (source) => ({
              bank_name: institution_name,
              total_amount: source.total_amount,
              transaction_count: source.transaction_count,
              description: source.income_description,
              income_id: source.income_source_id,
            })
          );
          return income_sources;
        });
      }) || [];

    setBankIncome(thisUsersIncome);
  }, []);

  useEffect(() => {
    getIncome();
  }, [getIncome, user.incomeConnected, user.incomeUpdateTime]);

  return (
    <Box width="40vw">
      <VStack>
        <Heading as="h4" size="md">
          Bank income
        </Heading>
        <p>
          <LinkLoader
            buttonText={"Add bank income"}
            income={true}
            incomeType={IncomeType.Bank}
          ></LinkLoader>
        </p>
        {bankIncome.length === 0 ? (
          <Box fontSize="sm">
            Identify income by locating recurring deposits in your bank account.
          </Box>
        ) : (
          <Flex
            maxWidth="100%"
            flexWrap="wrap"
            justifyContent="space-evenly"
            direction={{ base: "column", lg: "row" }}
            gap={2}
          >
            {bankIncome.map((e: BankData, idx) => (
              <Box
                key={e.income_id}
                maxW={205}
                borderWidth="2px"
                borderRadius="lg"
                overflow="hidden"
                mx="2"
                px="3"
              >
                <Box mt="1" fontWeight="semibold" as="h4" isTruncated>
                  {e.bank_name}
                </Box>
                <Box fontSize="sm" isTruncated>
                  {e.description}
                </Box>
                <Box as="b">
                  {e.total_amount.toLocaleString("en-US", {
                    style: "currency",
                    currency: hardCodedCurrencyCode,
                  })}{" "}
                </Box>

                <Box as="span">(from {e.transaction_count} txns)</Box>
              </Box>
            ))}
          </Flex>
        )}
      </VStack>
    </Box>
  );
};

export default BankIncome;
