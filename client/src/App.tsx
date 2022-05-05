import { useState } from "react";

import "./App.css";
import { UserContext, PlaidConnectStatus } from "./components/UserContext";
import UserStatus from "./components/UserStatus";

function App() {
  const [user, setUser] = useState({
    userName: "Default User",
    incomeConnected: PlaidConnectStatus.Unknown,
    incomeUpdateTime: Date.now(),
    liabilitiesConnected: PlaidConnectStatus.Unknown,
  });

  return (
    <div className="App">
      <header className="App-header">
        <h2>Todd's Pre-owned hoverboards!</h2>
        <div className="Subtitle">
          If they set your house on fire, your next hoverboard is half off!
        </div>
        <h3>Financing</h3>
        <p>Find out if you qualify for financing for a pre-owned hoverboard!</p>
        <UserContext.Provider value={{ user, setUser }}>
          <UserStatus />
        </UserContext.Provider>
      </header>
    </div>
  );
}

export default App;
