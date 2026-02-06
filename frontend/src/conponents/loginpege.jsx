import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./login";

export default function LoginPage() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const onLogin = async (e) => {
    e.preventDefault();
    setError("");
    setRegisterSuccess("");
    try {
      await login(username, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "ログインに失敗しました");
    }
  };

  const onRegister = async (e) => {
    e.preventDefault();
    setError("");
    setRegisterSuccess("");
    if (!username.trim()) {
      setError("アカウント名を入力してください");
      return;
    }
    try {
      await register(username.trim(), password);
      setRegisterSuccess("登録しました。ログインしてください。");
      setPassword("");
      setMode("login");
    } catch (err) {
      setError(err.message || "登録に失敗しました");
    }
  };

  const formStyle = { width: 340, padding: 20, borderRadius: 12, background: "#111827", color: "#e5e7eb" };
  const inputStyle = { width: "100%", marginBottom: 8, padding: 10, boxSizing: "border-box" };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0f172a" }}>
      <div style={formStyle}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button
            type="button"
            onClick={() => { setMode("login"); setError(""); setRegisterSuccess(""); }}
            style={{ flex: 1, padding: 8, background: mode === "login" ? "#374151" : "transparent", border: "1px solid #4b5563", color: "#e5e7eb", borderRadius: 6, cursor: "pointer" }}
          >
            ログイン
          </button>
          <button
            type="button"
            onClick={() => { setMode("register"); setError(""); setRegisterSuccess(""); }}
            style={{ flex: 1, padding: 8, background: mode === "register" ? "#374151" : "transparent", border: "1px solid #4b5563", color: "#e5e7eb", borderRadius: 6, cursor: "pointer" }}
          >
            新規登録
          </button>
        </div>

        {mode === "login" ? (
          <form onSubmit={onLogin}>
            <h2 style={{ marginBottom: 12, fontSize: 18 }}>ログイン</h2>
            <input
              placeholder="アカウント名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={inputStyle}
            />
            <input
              type="password"
              placeholder="パスワード"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ ...inputStyle, marginBottom: 12 }}
            />
            <button type="submit" style={{ width: "100%", padding: 10 }}>ログイン</button>
            {error && <p style={{ color: "#f87171", marginTop: 8 }}>{error}</p>}
            {registerSuccess && <p style={{ color: "#34d399", marginTop: 8 }}>{registerSuccess}</p>}
          </form>
        ) : (
          <form onSubmit={onRegister}>
            <h2 style={{ marginBottom: 12, fontSize: 18 }}>新規登録</h2>
            <input
              placeholder="アカウント名（同じ名前は使えません）"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={inputStyle}
            />
            <input
              type="password"
              placeholder="パスワード（同じでも可）"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ ...inputStyle, marginBottom: 12 }}
            />
            <button type="submit" style={{ width: "100%", padding: 10 }}>登録する</button>
            {error && <p style={{ color: "#f87171", marginTop: 8 }}>{error}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
