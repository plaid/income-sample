import { useCallback, useContext, useEffect, useState } from "react";
import { UserContext } from "./UserContext";
import LinkLoader, { IncomeType } from "./LinkLoader";

interface PayrollData {
  employer: string;
  ytd_gross: number;
  ytd_net: number;
  pay_period_gross: number;
  pay_period_frequency: string;
  downloaded_from_provider: boolean;
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
        };
      }
    );
    setPayrollIncome(thisUsersIncome);
  }, []);

  useEffect(() => {
    getIncome();
  }, [getIncome, user.incomeConnected, user.incomeUpdateTime]);

  return (
    <div>
      <h4>Payroll income:</h4>
      <p>
        <LinkLoader
          buttonText={"Add more income"}
          income={true}
          incomeType={IncomeType.Payroll}
        ></LinkLoader>
      </p>
      <table
        cellPadding={5}
        style={{ marginLeft: "auto", marginRight: "auto" }}
      >
        <thead>
          <tr>
            <th align="left" style={{ maxWidth: "350px" }}>
              Employer
            </th>
            <th align="right">Gross YTD</th>
            <th align="right">Net YTD</th>
            <th align="right">You get paid...</th>
            <th>...on</th>
            <th>Downloaded?</th>
          </tr>
        </thead>
        <tbody>
          {payrollIncome.map((payroll: PayrollData, idx) => (
            <tr key={idx}>
              <td align="left" style={{ maxWidth: "350px" }}>
                {payroll.employer}
              </td>
              <td align="right">
                {payroll.ytd_gross.toLocaleString("en-US", {
                  style: "currency",
                  currency: hardCodedCurrencyCode,
                })}
              </td>
              <td align="right">
                {payroll.ytd_net.toLocaleString("en-US", {
                  style: "currency",
                  currency: hardCodedCurrencyCode,
                })}
              </td>
              <td align="right">
                {payroll.pay_period_gross.toLocaleString("en-US", {
                  style: "currency",
                  currency: hardCodedCurrencyCode,
                })}
              </td>
              <td>{payroll.pay_period_frequency}</td>
              <td>{payroll.downloaded_from_provider ? "✅" : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PayrollIncome;
