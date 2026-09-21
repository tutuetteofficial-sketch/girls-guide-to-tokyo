"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.replace("/");
        return;
      }

      setLoading(false);
    }

    checkSession();
  }, [router]);

  async function handleGoogleLogin() {
    setErrorMessage("");
    setGoogleLoading(true);

    const redirectTo = `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setGoogleLoading(false);
    }
  }

  async function handleEmailLogin(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");
    setEmailLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setEmailLoading(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  if (loading) {
    return (
      <main style={styles.loadingPage}>
        <div style={styles.loadingBox}>
          <p style={styles.logo}>TOKYO GUIDE</p>
          <p style={styles.loadingText}>Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <p style={styles.eyebrow}>TOKYO GUIDE</p>

        <h1 style={styles.title}>Welcome</h1>

        <p style={styles.description}>
          Save your favorite places, foods and products
          and keep them in your MY LIST.
        </p>

        {errorMessage && (
          <div style={styles.error}>
            {errorMessage}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          style={styles.googleButton}
        >
          <span style={styles.googleIcon}>G</span>

          <span>
            {googleLoading
              ? "Connecting..."
              : "Continue with Google"}
          </span>
        </button>

        <div style={styles.divider}>
          <span />
          <p>OR</p>
          <span />
        </div>

        <form
          onSubmit={handleEmailLogin}
          style={styles.form}
        >
          <label style={styles.label}>
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder="you@example.com"
            autoComplete="email"
            required
            style={styles.input}
          />

          <label style={styles.label}>
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            placeholder="Password"
            autoComplete="current-password"
            required
            style={styles.input}
          />

          <button
            type="submit"
            disabled={emailLoading}
            style={styles.emailButton}
          >
            {emailLoading
              ? "Signing in..."
              : "Sign in"}
          </button>
        </form>

        <p style={styles.note}>
          Google login is recommended for MY LIST.
        </p>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "calc(100vh - 72px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 20px",
    background: "#faf8f6",
  },

  loadingPage: {
    minHeight: "70vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#faf8f6",
  },

  loadingBox: {
    textAlign: "center" as const,
  },

  card: {
    width: "100%",
    maxWidth: "430px",
    padding: "48px 42px",
    background: "#fff",
    border: "1px solid #e7e0dc",
  },

  eyebrow: {
    margin: "0 0 12px",
    color: "#c8647b",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "2px",
    textAlign: "center" as const,
  },

  logo: {
    margin: 0,
    color: "#222",
    fontFamily: "Georgia, serif",
    fontSize: "16px",
    letterSpacing: "2.5px",
  },

  title: {
    margin: 0,
    color: "#222",
    fontFamily: "Georgia, serif",
    fontSize: "34px",
    fontWeight: 400,
    textAlign: "center" as const,
  },

  description: {
    margin: "16px auto 30px",
    maxWidth: "330px",
    color: "#888",
    fontSize: "12px",
    lineHeight: 1.8,
    textAlign: "center" as const,
  },

  error: {
    marginBottom: "18px",
    padding: "12px 14px",
    background: "#fff4f5",
    border: "1px solid #f0d4d9",
    color: "#a84d61",
    fontSize: "12px",
    lineHeight: 1.6,
  },

  googleButton: {
    width: "100%",
    height: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    border: "1px solid #ddd",
    background: "#fff",
    color: "#333",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
  },

  googleIcon: {
    fontSize: "17px",
    fontWeight: 700,
  },

  divider: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    margin: "25px 0",
  },

  dividerLine: {
    flex: 1,
  },

  form: {
    display: "flex",
    flexDirection: "column" as const,
  },

  label: {
    marginBottom: "7px",
    color: "#555",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.5px",
  },

  input: {
    width: "100%",
    height: "46px",
    marginBottom: "18px",
    padding: "0 13px",
    border: "1px solid #ddd",
    background: "#fff",
    color: "#222",
    fontSize: "13px",
    outline: "none",
    boxSizing: "border-box" as const,
  },

  emailButton: {
    width: "100%",
    height: "46px",
    border: 0,
    background: "#222",
    color: "#fff",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "1px",
    cursor: "pointer",
  },

  note: {
    margin: "24px 0 0",
    color: "#aaa",
    fontSize: "10px",
    lineHeight: 1.6,
    textAlign: "center" as const,
  },

  loadingText: {
    marginTop: "14px",
    color: "#888",
    fontSize: "12px",
  },
};