"use client";

import { useState } from "react";
import { loginAction } from "@/actions/auth";
import Link from "next/link";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const result = await loginAction(formData);
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
    } catch {
      // redirect throws - this is expected on success
    }
  }

  return (
    <div className="login-container">
      <div className="login-bg-gradient login-bg-gradient-1" />
      <div className="login-bg-gradient login-bg-gradient-2" />

      <div className="login-card">
        <div style={{ textAlign: "center", marginBottom: "8px" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <img src="/logo.png" alt="Task Organizer Logo" style={{ width: '100%', height: '100%', borderRadius: 16, objectFit: 'cover' }} />
          </div>
        </div>
        <h1 className="login-title">Task Organizer</h1>
        <p className="login-subtitle">Sign in to your dashboard</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username" className="form-label">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              className="form-input"
              placeholder="Enter your username"
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-input"
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            marginTop: 24,
            fontSize: "0.85rem",
            color: "var(--text-muted)",
          }}
        >
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            style={{
              color: "var(--accent-violet)",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
