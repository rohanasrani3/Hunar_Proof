"use client";
import { signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
export function Logout({ label }: { label: string }) {
  const [pending, setPending] = useState(false);
  return <button type="button" disabled={pending} onClick={async () => {
    setPending(true);
    try {
      const result = await signOut({ redirect: false, callbackUrl: "/" });
      sessionStorage.setItem("kareghar-auth-notice", "logout");
      window.location.assign(result.url || "/");
    } finally {
      setPending(false);
    }
  }}>{label}</button>;
}
export function AuthNotice({ hi }: { hi: boolean }) {
  const [notice, setNotice] = useState<"login" | "logout" | null>(null);
  useEffect(() => {
    const value = sessionStorage.getItem("kareghar-auth-notice");
    sessionStorage.removeItem("kareghar-auth-notice");
    if (value !== "login" && value !== "logout") return;
    setNotice(value);
    const timer = window.setTimeout(() => setNotice(null), 5000);
    return () => window.clearTimeout(timer);
  }, []);
  if (!notice) return null;
  return <div className="auth-notice" role="status">
    <span aria-hidden="true">✓</span>
    <span>{notice === "login" ? (hi ? "आप लॉग इन हो गए हैं।" : "You are logged in.") : (hi ? "आप लॉग आउट हो गए हैं।" : "You are logged out.")}</span>
    <button type="button" onClick={() => setNotice(null)} aria-label={hi ? "संदेश बंद करें" : "Dismiss message"}>×</button>
  </div>;
}
export function Login({ hi }: { hi: boolean }) {
  const [error, setError] = useState(false),
    [pending, setPending] = useState(false);
  return (
    <form
      method="post" className="stack"
      onSubmit={async (e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        setPending(true);
        setError(false);
        try {
          const result = await signIn("credentials", {
            username: data.get("username"),
            password: data.get("password"),
            redirect: false,
          });
          if (result?.ok) {
            sessionStorage.setItem("kareghar-auth-notice", "login");
            window.location.assign("/");
          }
          else setError(true);
        } catch {
          setError(true);
        } finally {
          setPending(false);
        }
      }}
    >
      <label>
        {hi ? "उपयोगकर्ता नाम" : "Username"}
        <input name="username" required autoComplete="username" />
      </label>
      <label>
        {hi ? "पासवर्ड" : "Password"}
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </label>
      <button className="button" disabled={pending}>
        {hi ? "लॉग इन करें" : "Log in"}
      </button>
      {error && (
        <p role="alert">
          {hi
            ? "लॉग इन विफल। जानकारी जाँचें या कुछ देर बाद प्रयास करें।"
            : "Login failed. Check your details or try again later."}
        </p>
      )}
    </form>
  );
}
