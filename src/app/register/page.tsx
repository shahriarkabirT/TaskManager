"use client";

import { useState } from "react";
import { registerAction } from "@/actions/auth";
import Link from "next/link";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const result = await registerAction(formData);
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
        <h1 className="login-title">Create Account</h1>
        <p className="login-subtitle">
          Set up your task organizer in seconds
        </p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              className="form-input"
              placeholder="e.g. Shahriar Kabir"
              required
              autoComplete="name"
              minLength={2}
              maxLength={50}
            />
          </div>

          <div className="form-group">
            <label htmlFor="username" className="form-label">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              className="form-input"
              placeholder="e.g. shahriar"
              required
              autoComplete="username"
              minLength={3}
              maxLength={30}
              pattern="[a-zA-Z0-9_]+"
              title="Only letters, numbers, and underscores"
            />
            <span
              style={{
                fontSize: "0.7rem",
                color: "var(--text-muted)",
                marginTop: 4,
                display: "block",
              }}
            >
              Letters, numbers, and underscores only
            </span>
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
              placeholder="At least 6 characters"
              required
              autoComplete="new-password"
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              className="form-input"
              placeholder="Re-enter your password"
              required
              autoComplete="new-password"
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? "Creating account..." : "Create Account"}
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
          Already have an account?{" "}
          <Link
            href="/login"
            style={{
              color: "var(--accent-violet)",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
