"use client";

import Link from "next/link";
import { Eye, EyeOff, LockKeyhole, Mail, PackageCheck, ShieldCheck, UserCheck, UserPlus, UserRound } from "lucide-react";
import { useState } from "react";

export function AccountFormTabs({ nonces, accountUrl, lostPasswordUrl }) {
  const [tab, setTab] = useState("login");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="account-container">
      <div className="account-tab-buttons">
        <button
          type="button"
          className={`account-tab-btn ${tab === "login" ? "active" : ""}`}
          onClick={() => setTab("login")}
        >
          <UserRound size={17} />
          <span>Sign In</span>
        </button>
        <button
          type="button"
          className={`account-tab-btn ${tab === "register" ? "active" : ""}`}
          onClick={() => setTab("register")}
        >
          <UserPlus size={17} />
          <span>Create Account</span>
        </button>
      </div>

      <div className="account-card-body">
        {tab === "login" ? (
          <div className="account-tab-content fade-in">
            <div className="account-form-header">
              <div className="form-icon">
                <UserCheck size={26} />
              </div>
              <h2>Sign in to screwnet</h2>
              <p>Manage your orders, saved addresses, and shipment tracking securely.</p>
            </div>

            <form className="account-form-grid" action={accountUrl} method="post">
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
                    required
                  />
                </div>
              </div>

              <div className="form-field">
                <div className="field-label-row">
                  <label htmlFor="password">Password</label>
                  <a className="forgot-password-link" href={lostPasswordUrl}>
                    Forgot Password?
                  </a>
                </div>
                <div className="input-with-icon">
                  <LockKeyhole size={17} className="field-icon" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••••••"
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
                  <input type="checkbox" name="rememberme" value="forever" defaultChecked />
                  <span>Remember me on this browser</span>
                </label>
              </div>

              {nonces.login && <input type="hidden" name="woocommerce-login-nonce" value={nonces.login} />}
              <input type="hidden" name="_wp_http_referer" value="/my-account/" />

              <button className="button account-submit-btn" type="submit" name="login" value="Log in">
                <LockKeyhole size={16} /> Sign In Securely
              </button>
            </form>
          </div>
        ) : (
          <div className="account-tab-content fade-in">
            <div className="account-form-header">
              <div className="form-icon">
                <PackageCheck size={26} />
              </div>
              <h2>Create New Account</h2>
              <p>Join screwnet for faster checkout, order history & business GST invoicing.</p>
            </div>

            {nonces.registrationEnabled ? (
              <form className="account-form-grid" action={accountUrl} method="post">
                <div className="form-field">
                  <label htmlFor="reg-email">Email Address</label>
                  <div className="input-with-icon">
                    <Mail size={17} className="field-icon" />
                    <input
                      id="reg-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="yourname@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="form-note-box">
                  <p>
                    A password will be automatically generated and sent to your email address, or configured during account setup.
                  </p>
                </div>

                {nonces.register && <input type="hidden" name="woocommerce-register-nonce" value={nonces.register} />}
                <input type="hidden" name="_wp_http_referer" value="/my-account/" />

                <button className="button account-submit-btn" type="submit" name="register" value="Register">
                  <UserPlus size={16} /> Create Account
                </button>
              </form>
            ) : (
              <div className="registration-disabled-box">
                <p>Registration is currently managed by the secure account portal.</p>
                <a className="button account-submit-btn" href={accountUrl}>
                  Open Account Registration
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="account-security-footer">
        <ShieldCheck size={18} />
        <span>Your account credentials & sensitive data remain protected with 256-bit SSL encryption.</span>
      </div>
    </div>
  );
}

