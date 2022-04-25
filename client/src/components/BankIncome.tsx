import { useCallback, useEffect, useState } from "react";
import LinkLoader, { IncomeType } from "./LinkLoader";

interface BankData {
  bank_name: String;
  total_amount: number;
  transaction_count: number;
  description: number;
}

const BankIncome = () => {
  const [bankIncome, setBankIncome] = useState(Array<BankData>());
  const hardCodedCurrencyCode = "USD";

  const newIncomeWasAdded = async (public_token: string) => {
    console.log(
      `Link is done! I have a public token: ${public_token} Which I could use if I wanted to get other information from this bank.`
    );
    await getIncome();
  };

  const getIncome = useCallback(async () => {
    const response = await fetch("/appServer/getBankIncome");
    const data = await response.json();
    console.log("Bank Income: ", data);
    const thisUsersIncome = Array<BankData>();

    // TODO: This could probably be done with a clever enough flatmap
    data.bank_income?.forEach(
      (report: {
        items: {
          insitution_name: string;
          bank_income_sources: {
            total_amount: number;
            transaction_count: number;
            income_description: number;
          }[];
        }[];
      }) => {
        report.items.forEach((item) => {
          const insitution_name = item.insitution_name;
          item.bank_income_sources.forEach((source) => {
            const nextItem: BankData = {
              bank_name: insitution_name,
              total_amount: source.total_amount,
              transaction_count: source.transaction_count,
              description: source.income_description,
            };
            thisUsersIncome.push(nextItem);
          });
        });
      }
    );
    setBankIncome(thisUsersIncome);
  }, []);

  useEffect(() => {
    getIncome();
  }, [getIncome]);

  return (
    <div>
      <h4>Bank income</h4>
      <p>
        <LinkLoader
          buttonText={"Add bank income"}
          income={true}
          incomeType={IncomeType.Bank}
          successCallback={newIncomeWasAdded}
        ></LinkLoader>
      </p>
      {bankIncome.length === 0 ? (
        <p>
          Click the "Add bank income" button to add any recurring income that
          might regularly appear in your bank account
        </p>
      ) : (
        <table
          cellPadding={5}
          style={{ marginLeft: "auto", marginRight: "auto" }}
        >
          <thead>
            <tr>
              <th align="left" style={{ maxWidth: "350px" }}>
                Institution
              </th>
              <th align="left">Income Type</th>
              <th align="right">Total Amount</th>
            </tr>
          </thead>
          <tbody>
            {bankIncome.map((e: BankData, idx) => (
              <tr key={idx}>
                <td align="left" style={{ maxWidth: "350px" }}>
                  {e.bank_name}
                </td>
                <td align="left">{e.description}</td>
                <td align="right">
                  {e.total_amount.toLocaleString("en-US", {
                    style: "currency",
                    currency: hardCodedCurrencyCode,
                  })}{" "}
                  (from {e.transaction_count} txns)
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default BankIncome;
