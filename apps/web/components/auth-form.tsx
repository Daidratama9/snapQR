"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type Mode = "sign-in" | "register";
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function AuthForm({ mode }: { mode: Mode }) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const isRegister = mode === "register";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    const data = new FormData(event.currentTarget);
    const response = await fetch(`${apiUrl}/auth/${isRegister ? "register" : "login"}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: data.get("email"), password: data.get("password") }),
    });
    const payload = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) return setError(payload.message ?? "Something went wrong. Please try again.");
    setSuccess(isRegister ? "Account created. You are now signed in." : "You are signed in.");
  }

  return <main><section className="card" aria-labelledby="auth-title">
    <div className="brand">SNAPQR</div>
    <h1 id="auth-title">{isRegister ? "Create staff account" : "Sign in"}</h1>
    <p>{isRegister ? "Create the first staff account for your SnapQR workspace." : "Sign in to manage your SnapQR workspace."}</p>
    <form onSubmit={submit}>
      <label>Email<input name="email" type="email" autoComplete="email" required /></label>
      <label>Password<input name="password" type="password" autoComplete={isRegister ? "new-password" : "current-password"} minLength={12} required /></label>
      {error && <p className="error" role="alert">{error}</p>}
      {success && <p className="success" role="status">{success}</p>}
      <button disabled={loading} type="submit">{loading ? "Please wait…" : isRegister ? "Create account" : "Sign in"}</button>
    </form>
    <p>{isRegister ? <>Already have an account? <Link href="/sign-in">Sign in</Link></> : <>Need an account? <Link href="/register">Create one</Link></>}</p>
  </section></main>;
}
