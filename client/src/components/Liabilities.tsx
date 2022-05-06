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
      <h4>Your current loans</h4>
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
          {userLiabilities.map((liability: LiabilityData) => (
            <tr key={liability.account_id}>
              <td align="left" style={{ maxWidth: "350px" }}>
                {liability.name}
              </td>
              <td align="left">{liability.type}</td>
              <td align="right">
                {liability.amount.toLocaleString("en-US", {
                  style: "currency",
                  currency: liability.currencyCode,
                })}
              </td>
              <td align="right">{liability.percentage.toFixed(2)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const normalizeLiabilityData = (data: any) => {
  // A little bit of work to merge these...
  type CreditType = {
    account_id: string;
    aprs: {
      apr_percentage: number;
    }[];
    is_overdue?: boolean;
  };
  type MortgageType = {
    account_id: string;
    interest_rate: {
      percentage: number;
    };
    is_overdue?: boolean;
    origination_principal_amount: number;
  };
  type StudentLoanType = {
    account_id: string;
    interest_rate_percentage: number;
    is_overdue?: boolean;
    origination_principal_amount: number;
  };

  const creditLiabilities = data.liabilities.credit?.map(
    (credit: CreditType) => {
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
      return newCredit;
    }
  );

  const mortgageLiabilities = data.liabilities.mortgage?.map(
    (mortgage: MortgageType) => {
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
      return newMortgage;
    }
  );

  const studentLiabilities = data.liabilities.student?.map(
    (student: StudentLoanType) => {
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
      return newStudent;
    }
  );
  return [
    ...(creditLiabilities || []),
    ...(mortgageLiabilities || []),
    ...(studentLiabilities || []),
  ];
};

export default Liabilities;
