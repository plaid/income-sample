import "./App.css";
import UserStatus from "./components/UserStatus";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h2>Todd's Pre-owned hoverboards!</h2>
        <div className="Subtitle">
          If they set your house on fire, your next hoverboard is half off!
        </div>
        <h3>Financing</h3>
        <p>Find out if you qualify for financing for a pre-owned hoverboard!</p>
        <UserStatus />
        <UserStatus income={true} />
      </header>
    </div>
  );
}

export default App;
