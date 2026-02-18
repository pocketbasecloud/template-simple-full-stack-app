import { useState } from "react";
import pb from "./lib/pb";
import LoginForm from "./components/LoginForm";
import Dashboard from "./components/Dashboard";
import "./App.css";

function App() {
  const [user, setUser] = useState(pb.authStore.record);

  function handleAuth() {
    setUser(pb.authStore.record);
  }

  if (!user) {
    return <LoginForm onLogin={handleAuth} />;
  }

  return <Dashboard user={user} onLogout={handleAuth} />;
}

export default App;
