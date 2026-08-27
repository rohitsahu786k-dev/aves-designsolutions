"use client";

import { Send } from "lucide-react";
import { useState } from "react";

export function ContactForm() {
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  async function submit(event) {
    event.preventDefault(); setStatus("sending"); setMessage("");
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).catch(() => null);
    const data = response ? await response.json().catch(() => ({})) : {};
    if (response?.ok) { setStatus("sent"); setMessage("Thank you. Your enquiry has been sent to the screwnet technical team."); event.currentTarget.reset(); }
    else { setStatus("error"); setMessage(data.message || "We could not send this enquiry. Please use email or phone support."); }
  }
  return <form className="checkout-form" onSubmit={submit}>
    <input name="website" className="contact-honeypot" tabIndex="-1" autoComplete="off" aria-hidden="true" />
    <select name="query" aria-label="Choose your query" required><option value="Order">Order</option><option value="Payment">Payment</option><option value="Billing">Billing</option><option value="Shipping">Shipping</option><option value="Other">Other</option></select>
    <div className="form-grid"><input name="name" placeholder="Your name" autoComplete="name" required /><input name="phone" placeholder="Phone number" inputMode="tel" autoComplete="tel" /></div>
    <input name="email" type="email" placeholder="Email address" autoComplete="email" required />
    <input name="subject" placeholder="Subject" required />
    <textarea name="message" placeholder="Message" rows="7" minLength="10" required />
    <button className="button" disabled={status === "sending"}><Send size={16} /> {status === "sending" ? "Sending..." : "Send enquiry"}</button>
    {message ? <p className={`form-status ${status}`} role="status">{message}</p> : null}
  </form>;
}
