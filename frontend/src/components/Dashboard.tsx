import type { RecordModel } from "pocketbase";
import pb from "../lib/pb";
import UserInfo from "./UserInfo";
import WeatherDashboard from "./WeatherDashboard";
import TodoList from "./TodoList";

export default function Dashboard({
  onLogout,
}: {
  onLogout: () => void;
}) {

  const user: RecordModel | null = pb.authStore.record;

  function handleLogout() {
    pb.authStore.clear();
    onLogout();
  }

  if (!user) {
    return null;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="header-right">
          <span>{user.name || user.email}</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>
      <div className="dashboard-content">
        <UserInfo />
        <TodoList />
        <WeatherDashboard />
      </div>
    </div>
  );
}
