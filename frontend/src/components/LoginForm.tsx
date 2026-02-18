import { useState } from "react";
import pb from "../lib/pb";

export default function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (isSignUp && password !== passwordConfirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await pb.collection("users").create({
          email,
          name,
          password,
          passwordConfirm,
        });
        await pb.collection("users").authWithPassword(email, password);
      } else {
        await pb.collection("users").authWithPassword(email, password);
      }

      onLogin();
    } catch (err: any) {
      if (isSignUp) {
        setError(err?.message || "Failed to create account");
      } else {
        setError("Invalid email or password");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>{isSignUp ? "Sign Up" : "Sign In"}</h2>
        {error && <p className="error">{error}</p>}
        {isSignUp && (
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {isSignUp && (
          <input
            type="password"
            placeholder="Confirm Password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
          />
        )}
        <button type="submit" disabled={loading}>
          {loading
            ? isSignUp
              ? "Creating account..."
              : "Signing in..."
            : isSignUp
            ? "Sign Up"
            : "Sign In"}
        </button>
        <p className="toggle-mode">
          {isSignUp ? "Already have an account? " : "Don't have an account? "}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
              setPasswordConfirm("");
              setName("");
            }}
            className="link-button"
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </p>
      </form>
    </div>
  );
}
