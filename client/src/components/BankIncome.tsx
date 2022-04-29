import { useCallback, useContext, useEffect, useState } from "react";
import { UserContext } from "./UserContext";
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
  const { user } = useContext(UserContext);

  const getIncome = useCallback(async () => {
    const response = await fetch("/appServer/getBankIncome");
    const data = await response.json();
    console.log("Bank Income: ", data);

    type BankItemType = {
      institution_name: string;
      bank_income_sources: {
        total_amount: number;
        transaction_count: number;
        income_description: number;
      }[];
    };

    type BankIncomeType = {
      items: BankItemType[];
    };

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
    <div>
      <h4>Bank income</h4>
      <p>
        <LinkLoader
          buttonText={"Add bank income"}
          income={true}
          incomeType={IncomeType.Bank}
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
