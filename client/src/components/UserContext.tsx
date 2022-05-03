import { createContext } from "react";

export enum PlaidConnectStatus {
  Unknown = "unknown",
  Connected = "connected",
  NotConnected = "notConnected",
}

export const UserContext = createContext({
  user: {
    userName: "",
    incomeConnected: PlaidConnectStatus.Unknown,
    incomeUpdateTime: Date.now(),
    liabilitiesConnected: PlaidConnectStatus.Unknown,
  },
  setUser: (obj: any) => {},
});
