import { useState } from "react";
import { Link, Navigate, useNavigate, useLocation } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { requestOtp, verifyOtp } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || "/";

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  async function handleRequestOtp(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const data = await requestOtp(email);
      setStep("otp");
      if (data.devOtp) {
        setCode(data.devOtp);
        setInfo(`Email delivery is blocked on free hosting. Your login code is ${data.devOtp}`);
      } else {
        setInfo("Check your inbox (and spam) for a 6-digit code.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await verifyOtp(email, code);
      login(data.token, data.user);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout compact>
      <section className="panel auth-panel">
        <p className="eyebrow">Authentication</p>
        <h1 className="panel-title">Log in with email</h1>
        <p className="panel-copy">
          We send a one-time code with Nodemailer. No password needed.
        </p>

        {step === "email" ? (
          <form className="auth-form" onSubmit={handleRequestOtp}>
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            {error ? <p className="form-error">{error}</p> : null}
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleVerifyOtp}>
            <p className="hint-inline">Code sent to {email}</p>
            <label className="field">
              <span>OTP code</span>
              <input
                type="text"
                required
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </label>
            {info ? <p className="form-info">{info}</p> : null}
            {error ? <p className="form-error">{error}</p> : null}
            <div className="action-row">
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? "Verifying..." : "Verify & continue"}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setError("");
                }}
              >
                Change email
              </button>
            </div>
          </form>
        )}

        <p className="auth-footer">
          <Link to="/posts">Browse public posts</Link>
        </p>
      </section>
    </Layout>
  );
}
