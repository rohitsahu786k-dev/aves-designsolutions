"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
  PackageCheck,
  Phone,
  ShieldCheck,
  UserCheck,
  UserPlus,
  UserRound,
} from "lucide-react";

export function AccountFormTabs() {
  const router = useRouter();
  const [tab, setTab] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [login, setLogin] = useState({ username: "", password: "", remember: true });
  const [register, setRegister] = useState({ first_name: "", last_name: "", email: "", phone: "", password: "" });
  const [resetEmail, setResetEmail] = useState("");

  function switchTab(next) {
    setTab(next);
    setError("");
    setNotice("");
  }

  async function submit(endpoint, payload, onSuccess) {
    setBusy(true);
    setError("");
    setNotice("");

    const response = await fetch(`/api/account/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => null);

    const data = await response?.json().catch(() => ({}));
    setBusy(false);

    if (!response?.ok) {
      setError(data?.message || "Something went wrong. Please try again.");
      return;
    }

    onSuccess?.(data);
  }

  function handleLogin(event) {
    event.preventDefault();
    submit("login", login, () => router.refresh());
  }

  function handleRegister(event) {
    event.preventDefault();
    submit("register", register, () => router.refresh());
  }

  function handleReset(event) {
    event.preventDefault();
    submit("lost-password", { email: resetEmail }, (data) =>
      setNotice(data?.message || "Password reset instructions have been sent."),
    );
  }

  return (
    <div className="account-container">
      {tab !== "reset" && (
        <div className="account-tab-buttons">
          <button
            type="button"
            className={`account-tab-btn ${tab === "login" ? "active" : ""}`}
            onClick={() => switchTab("login")}
          >
            <UserRound size={17} />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            className={`account-tab-btn ${tab === "register" ? "active" : ""}`}
            onClick={() => switchTab("register")}
          >
            <UserPlus size={17} />
            <span>Create Account</span>
          </button>
        </div>
      )}

      <div className="account-card-body">
        {error && <p className="account-alert error">{error}</p>}
        {notice && <p className="account-alert success">{notice}</p>}

        {tab === "login" && (
          <div className="account-tab-content fade-in">
            <div className="account-form-header">
              <div className="form-icon">
                <UserCheck size={26} />
              </div>
              <h2>Sign in to screwnet</h2>
              <p>Manage your orders, saved addresses, and shipment tracking securely.</p>
            </div>

            <form className="account-form-grid" onSubmit={handleLogin}>
              <div className="form-field">
                <label htmlFor="username">Username or Email Address</label>
                <div className="input-with-icon">
                  <Mail size={17} className="field-icon" />
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    placeholder="name@example.com"
                    value={login.username}
                    onChange={(event) => setLogin({ ...login, username: event.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-field">
                <div className="field-label-row">
                  <label htmlFor="password">Password</label>
                  <button type="button" className="forgot-password-link" onClick={() => switchTab("reset")}>
                    Forgot Password?
                  </button>
                </div>
                <div className="input-with-icon">
                  <LockKeyhole size={17} className="field-icon" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={login.password}
                    onChange={(event) => setLogin({ ...login, password: event.target.value })}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-options">
                <label className="remember-me-checkbox">
                  <input
                    type="checkbox"
                    name="rememberme"
                    checked={login.remember}
                    onChange={(event) => setLogin({ ...login, remember: event.target.checked })}
                  />
                  <span>Remember me on this browser</span>
                </label>
              </div>

              <button className="button account-submit-btn" type="submit" disabled={busy}>
                <LockKeyhole size={16} /> {busy ? "Signing In..." : "Sign In Securely"}
              </button>
            </form>
          </div>
        )}

        {tab === "register" && (
          <div className="account-tab-content fade-in">
            <div className="account-form-header">
              <div className="form-icon">
                <PackageCheck size={26} />
              </div>
              <h2>Create New Account</h2>
              <p>Join screwnet for faster checkout, order history &amp; business GST invoicing.</p>
            </div>

            <form className="account-form-grid" onSubmit={handleRegister}>
              <div className="account-field-row">
                <div className="form-field">
                  <label htmlFor="reg-first-name">First Name</label>
                  <div className="input-with-icon">
                    <UserRound size={17} className="field-icon" />
                    <input
                      id="reg-first-name"
                      type="text"
                      autoComplete="given-name"
                      placeholder="First name"
                      value={register.first_name}
                      onChange={(event) => setRegister({ ...register, first_name: event.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="reg-last-name">Last Name</label>
                  <div className="input-with-icon">
                    <UserRound size={17} className="field-icon" />
                    <input
                      id="reg-last-name"
                      type="text"
                      autoComplete="family-name"
                      placeholder="Last name"
                      value={register.last_name}
                      onChange={(event) => setRegister({ ...register, last_name: event.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="reg-email">Email Address</label>
                <div className="input-with-icon">
                  <Mail size={17} className="field-icon" />
                  <input
                    id="reg-email"
                    type="email"
                    autoComplete="email"
                    placeholder="yourname@example.com"
                    value={register.email}
                    onChange={(event) => setRegister({ ...register, email: event.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="reg-phone">Mobile Number</label>
                <div className="input-with-icon">
                  <Phone size={17} className="field-icon" />
                  <input
                    id="reg-phone"
                    type="tel"
                    autoComplete="tel"
                    inputMode="numeric"
                    placeholder="10-digit mobile number"
                    value={register.phone}
                    onChange={(event) => setRegister({ ...register, phone: event.target.value })}
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="reg-password">Password</label>
                <div className="input-with-icon">
                  <LockKeyhole size={17} className="field-icon" />
                  <input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Minimum 6 characters"
                    minLength={6}
                    value={register.password}
                    onChange={(event) => setRegister({ ...register, password: event.target.value })}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button className="button account-submit-btn" type="submit" disabled={busy}>
                <UserPlus size={16} /> {busy ? "Creating Account..." : "Create Account"}
              </button>
            </form>
          </div>
        )}

        {tab === "reset" && (
          <div className="account-tab-content fade-in">
            <div className="account-form-header">
              <div className="form-icon">
                <KeyRound size={26} />
              </div>
              <h2>Reset Your Password</h2>
              <p>Enter your registered email and we will send you a secure reset link.</p>
            </div>

            <form className="account-form-grid" onSubmit={handleReset}>
              <div className="form-field">
                <label htmlFor="reset-email">Email Address</label>
                <div className="input-with-icon">
                  <Mail size={17} className="field-icon" />
                  <input
                    id="reset-email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={resetEmail}
                    onChange={(event) => setResetEmail(event.target.value)}
                    required
                  />
                </div>
              </div>

              <button className="button account-submit-btn" type="submit" disabled={busy}>
                <KeyRound size={16} /> {busy ? "Sending..." : "Send Reset Link"}
              </button>

              <button type="button" className="account-back-link" onClick={() => switchTab("login")}>
                <ArrowLeft size={14} /> Back to Sign In
              </button>
            </form>
          </div>
        )}
      </div>

      <div className="account-security-footer">
        <ShieldCheck size={18} />
        <span>Your account credentials &amp; sensitive data remain protected with 256-bit SSL encryption.</span>
      </div>
    </div>
  );
}
