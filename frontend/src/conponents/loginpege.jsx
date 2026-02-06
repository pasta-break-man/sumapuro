import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./login";

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(username, password);
      navigate("/", { replace: true });
    } catch {
      setError("ログインに失敗しました");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0f172a" }}>
      <form onSubmit={onSubmit} style={{ width: 340, padding: 20, borderRadius: 12, background: "#111827", color: "#e5e7eb" }}>
        <h1 style={{ marginBottom: 12 }}>ログイン</h1>
        <input
          placeholder="ユーザー名"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ width: "100%", marginBottom: 8, padding: 10 }}
        />
        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", marginBottom: 12, padding: 10 }}
        />
        <button type="submit" style={{ width: "100%", padding: 10 }}>ログイン</button>
        {error && <p style={{ color: "#f87171", marginTop: 8 }}>{error}</p>}
      </form>
    </div>
  );
}
