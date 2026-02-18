import type { RecordModel } from "pocketbase";
import pb from "../lib/pb";

export default function UserInfo() {
  const user: RecordModel | null = pb.authStore.record;

  if (!user) {
    return null;
  }

  return (
    <div className="card user-info">
      <h3>User Info</h3>
      <p><strong>Name:</strong> {user.name || "N/A"}</p>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Joined:</strong> {new Date(user.created).toLocaleDateString()}</p>
    </div>
  );
}
