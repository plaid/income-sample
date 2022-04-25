import { useCallback, useEffect, useState } from "react";

enum LiabilityType {
  CREDIT_CARD = "Credit",
  STUDENT_LOAN = "Student Loan",
  MORTGAGE = "Mortgage",
}

interface LiabilityData {
  account_id: string;
  name: string;
  type: LiabilityType;
  orig_amt: number;
  amount: number;
  percentage: number;
  overdue?: boolean;
  currencyCode: string;
}

const Liabilities = () => {
  const [userLiabilities, setUserLiabilities] = useState(
    Array<LiabilityData>()
  );

  const loadUpLiabilities = useCallback(async () => {
    console.log("Fetching Liability Info!");
    const response = await fetch("/appServer/fetchLiabilities");
    const data = await response.json();
    console.log(data);

    const allLiabilityData: LiabilityData[] = normalizeLiabilityData(data);
    setUserLiabilities(normalizeLiabilityData(data));
    console.log(`Here's your cleaned up data:`);
    console.table(allLiabilityData);
  }, []);

  useEffect(() => {
    loadUpLiabilities();
  }, [loadUpLiabilities]);

  return (
    <div>
      <h4>Your current loans:</h4>
      <table cellPadding={5}>
        <thead>
          <tr>
            <th align="left" style={{ maxWidth: "350px" }}>
              Name
            </th>
            <th align="left">Loan type</th>
            <th align="right">Balance</th>
            <th align="right">APR</th>
          </tr>
        </thead>
        <tbody>
          {userLiabilities.map((e: LiabilityData) => (
            <tr key={e.account_id}>
              <td align="left" style={{ maxWidth: "350px" }}>
                {e.name}
              </td>
              <td align="left">{e.type}</td>
              <td align="right">
                {e.amount.toLocaleString("en-US", {
                  style: "currency",
                  currency: e.currencyCode,
                })}
              </td>
              <td align="right">{e.percentage.toFixed(2)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const normalizeLiabilityData = (data: any) => {
  // A little bit of work to merge these...
  const allLiabilities: LiabilityData[] = [];
  data.liabilities.credit?.forEach(
    (credit: {
      account_id: string;
      aprs: { apr_percentage: number }[];
      is_overdue?: boolean;
    }) => {
      const basicAccountInfo = data.accounts.find(
        (e: { account_id: string }) => e.account_id === credit.account_id
      );
      const newCredit: LiabilityData = {
        account_id: credit.account_id,
        currencyCode: basicAccountInfo.balances.iso_currency_code,
        name: basicAccountInfo.official_name ?? basicAccountInfo.name,
        type: LiabilityType.CREDIT_CARD,
        orig_amt: 0,
        amount: basicAccountInfo.balances.current,
        percentage: credit.aprs[0].apr_percentage,
        overdue: credit.is_overdue ?? false,
      };
      allLiabilities.push(newCredit);
    }
  );
  data.liabilities.mortgage?.forEach(
    (mortgage: {
      account_id: string;
      interest_rate: { percentage: number };
      is_overdue?: boolean;
      origination_principal_amount: number;
    }) => {
      const basicAccountInfo = data.accounts.find(
        (e: { account_id: string }) => e.account_id === mortgage.account_id
      );
      const newMortgage: LiabilityData = {
        account_id: mortgage.account_id,
        currencyCode: basicAccountInfo.balances.iso_currency_code,
        name: basicAccountInfo.official_name ?? basicAccountInfo.name,
        type: LiabilityType.MORTGAGE,
        orig_amt: mortgage.origination_principal_amount,
        amount: basicAccountInfo.balances.current,
        percentage: mortgage.interest_rate.percentage,
        overdue: mortgage.is_overdue ?? false,
      };
      allLiabilities.push(newMortgage);
    }
  );
  data.liabilities.student?.forEach(
    (student: {
      account_id: string;
      interest_rate_percentage: number;
      is_overdue?: boolean;
      origination_principal_amount: number;
    }) => {
      const basicAccountInfo = data.accounts.find(
        (e: { account_id: string }) => e.account_id === student.account_id
      );
      const newStudent: LiabilityData = {
        account_id: student.account_id,
        currencyCode: basicAccountInfo.balances.iso_currency_code,
        name: basicAccountInfo.official_name ?? basicAccountInfo.name,
        type: LiabilityType.STUDENT_LOAN,
        orig_amt: student.origination_principal_amount,
        amount: basicAccountInfo.balances.current,
        percentage: student.interest_rate_percentage,
        overdue: student.is_overdue ?? false,
      };
      allLiabilities.push(newStudent);
    }
  );
  return allLiabilities;
};

export default Liabilities;
