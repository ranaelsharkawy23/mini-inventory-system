import { FormEvent, useState } from "react";
import { api } from "../api";
import { setToken } from "../auth";

export function LoginForm({ onAuthenticated }: { onAuthenticated: () => void }) {
    const [mode, setMode] = useState<"login" | "register">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            const result = mode === "login" ? await api.login({ email, password }) : await api.register({ email, password });
            setToken(result.token);
            onAuthenticated();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="app">
            <h1>Mini Inventory System</h1>
            <form className="form" onSubmit={handleSubmit} style={{ maxWidth: 320 }}>
                <h3>{mode === "login" ? "Log In" : "Create Account"}</h3>
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
                    minLength={8}
                />
                <button type="submit" disabled={submitting}>
                    {submitting ? "Please wait…" : mode === "login" ? "Log In" : "Create Account"}
                </button>
                {error && <span className="error">{error}</span>}
                <button
                    type="button"
                    onClick={() => {
                        setMode(mode === "login" ? "register" : "login");
                        setError(null);
                    }}
                    style={{ background: "none", color: "#333", border: "none", textDecoration: "underline" }}
                >
                    {mode === "login" ? "Need an account? Register" : "Already have an account? Log in"}
                </button>
            </form>
        </div>
    );
}