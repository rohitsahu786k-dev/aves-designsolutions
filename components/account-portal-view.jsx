"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  User,
  Package,
  MapPin,
  Lock,
  LogOut,
  Mail,
  Phone,
  Building,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ShoppingBag,
  ArrowRight,
  Eye,
  EyeOff,
  UserCheck,
  PackageCheck,
  ShieldCheck,
  X,
  CreditCard,
  Edit2
} from "lucide-react";
import {
  getStoredToken,
  getStoredUser,
  clearStoredAuth,
  loginCustomer,
  registerCustomer,
  getCustomerProfile,
  updateCustomerProfile,
  updateCustomerAddress,
  getCustomerOrders,
  requestLostPassword
} from "@/lib/customer-auth";

export function AccountPortalView() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Tab State
  const [activeTab, setActiveTab] = useState("dashboard"); // 'dashboard' | 'orders' | 'addresses' | 'details'

  // Auth Form State
  const [authMode, setAuthMode] = useState("login"); // 'login' | 'register'
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  // Register Form State
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPhone, setRegPhone] = useState("");

  // Lost Password Modal
  const [showLostPassword, setShowLostPassword] = useState(false);
  const [lostEmail, setLostEmail] = useState("");
  const [lostLoading, setLostLoading] = useState(false);
  const [lostMsg, setLostMsg] = useState("");

  // Orders State
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Addresses State
  const [editingAddressType, setEditingAddressType] = useState(null); // 'billing' | 'shipping' | null
  const [addressForm, setAddressForm] = useState({
    first_name: "",
    last_name: "",
    company: "",
    address_1: "",
    address_2: "",
    city: "",
    state: "",
    postcode: "",
    country: "IN",
    phone: "",
    email: "",
  });
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressFeedback, setAddressFeedback] = useState({ error: "", success: "" });

  // Profile Details Form State
  const [profileForm, setProfileForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState({ error: "", success: "" });

  // 1. Check existing session on mount
  useEffect(() => {
    const savedToken = getStoredToken();
    const savedUser = getStoredUser();

    if (savedToken) {
      setToken(savedToken);
      if (savedUser) {
        setUser(savedUser);
        initFormsFromUser(savedUser);
      }
      // Silently refresh profile in background
      getCustomerProfile()
        .then((freshUser) => {
          if (freshUser) {
            setUser(freshUser);
            initFormsFromUser(freshUser);
          }
        })
        .catch(() => {
          // Token might be invalid/expired
        })
        .finally(() => {
          setIsInitializing(false);
        });
    } else {
      setIsInitializing(false);
    }
  }, []);

  function initFormsFromUser(u) {
    setProfileForm({
      first_name: u.first_name || "",
      last_name: u.last_name || "",
      email: u.email || "",
      current_password: "",
      new_password: "",
      confirm_password: "",
    });
  }

  // 2. Fetch Orders when user visits orders or dashboard
  const loadOrders = useCallback(async () => {
    if (!token) return;
    setOrdersLoading(true);
    try {
      const list = await getCustomerOrders();
      setOrders(list);
    } catch (err) {
      console.error("Error loading orders:", err);
    } finally {
      setOrdersLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token && (activeTab === "orders" || activeTab === "dashboard")) {
      loadOrders();
    }
  }, [token, activeTab, loadOrders]);

  // 3. Handle Login
  async function handleLogin(e) {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    setAuthLoading(true);

    try {
      const res = await loginCustomer(loginEmail, loginPassword);
      setToken(res.token);
      setUser(res.user);
      initFormsFromUser(res.user);
      setAuthSuccess("Signed in successfully!");
    } catch (err) {
      setAuthError(err.message || "Invalid email or password. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  // 4. Handle Registration
  async function handleRegister(e) {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    setAuthLoading(true);

    try {
      const res = await registerCustomer({
        email: regEmail,
        password: regPassword,
        first_name: regFirstName,
        last_name: regLastName,
        phone: regPhone,
      });
      setToken(res.token);
      setUser(res.user);
      initFormsFromUser(res.user);
      setAuthSuccess("Account created successfully!");
    } catch (err) {
      setAuthError(err.message || "Registration failed. Please check your information.");
    } finally {
      setAuthLoading(false);
    }
  }

  // 5. Handle Logout
  function handleLogout() {
    clearStoredAuth();
    setToken(null);
    setUser(null);
    setOrders([]);
    setActiveTab("dashboard");
    setAuthSuccess("You have been signed out.");
  }

  // 6. Handle Lost Password
  async function handleLostPassword(e) {
    e.preventDefault();
    if (!lostEmail) return;
    setLostLoading(true);
    setLostMsg("");

    try {
      const res = await requestLostPassword(lostEmail);
      setLostMsg(res.message || "Reset link sent if email exists.");
    } catch {
      setLostMsg("Instructions sent if an account matches that email.");
    } finally {
      setLostLoading(false);
    }
  }

  // 7. Start Editing Address
  function startEditAddress(type) {
    setEditingAddressType(type);
    setAddressFeedback({ error: "", success: "" });
    const current = type === "shipping" ? user?.shipping : user?.billing;
    setAddressForm({
      first_name: current?.first_name || user?.first_name || "",
      last_name: current?.last_name || user?.last_name || "",
      company: current?.company || "",
      address_1: current?.address_1 || "",
      address_2: current?.address_2 || "",
      city: current?.city || "",
      state: current?.state || "",
      postcode: current?.postcode || "",
      country: current?.country || "IN",
      phone: current?.phone || "",
      email: current?.email || user?.email || "",
    });
  }

  // 8. Save Address
  async function handleSaveAddress(e) {
    e.preventDefault();
    setAddressLoading(true);
    setAddressFeedback({ error: "", success: "" });

    try {
      const updatedUser = await updateCustomerAddress(editingAddressType, addressForm);
      setUser(updatedUser);
      setAddressFeedback({ error: "", success: `${editingAddressType === "shipping" ? "Shipping" : "Billing"} address updated successfully!` });
      setEditingAddressType(null);
    } catch (err) {
      setAddressFeedback({ error: err.message || "Failed to update address.", success: "" });
    } finally {
      setAddressLoading(false);
    }
  }

  // 9. Save Profile Details
  async function handleSaveProfile(e) {
    e.preventDefault();
    setProfileFeedback({ error: "", success: "" });

    if (profileForm.new_password && profileForm.new_password !== profileForm.confirm_password) {
      setProfileFeedback({ error: "New passwords do not match.", success: "" });
      return;
    }

    setProfileLoading(true);
    try {
      const updatedUser = await updateCustomerProfile({
        first_name: profileForm.first_name,
        last_name: profileForm.last_name,
        email: profileForm.email,
        current_password: profileForm.current_password,
        new_password: profileForm.new_password,
      });
      setUser(updatedUser);
      setProfileFeedback({ error: "", success: "Account details updated successfully!" });
      setProfileForm((prev) => ({
        ...prev,
        current_password: "",
        new_password: "",
        confirm_password: "",
      }));
    } catch (err) {
      setProfileFeedback({ error: err.message || "Failed to update account details.", success: "" });
    } finally {
      setProfileLoading(false);
    }
  }

  if (isInitializing) {
    return (
      <div className="account-portal-wrapper" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#64748b" }}>
          <RefreshCw className="animate-spin" size={20} />
          <span>Loading your account...</span>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW A: LOGGED IN PORTAL
  // =========================================================================
  if (token && user) {
    const initials = (user.first_name?.[0] || user.display_name?.[0] || user.email?.[0] || "U").toUpperCase();

    return (
      <div className="account-portal-wrapper">
        {/* User Banner */}
        <div className="account-user-banner">
          <div className="account-user-meta">
            <div className="account-avatar">{initials}</div>
            <div className="account-user-names">
              <h1>
                Hello, {user.first_name ? `${user.first_name} ${user.last_name || ""}` : user.display_name}
                <span className="account-role-badge">Verified Customer</span>
              </h1>
              <p>{user.email}</p>
            </div>
          </div>
          <button type="button" onClick={handleLogout} className="account-logout-btn">
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="account-nav-tabs">
          <button
            type="button"
            className={`account-nav-tab ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <User size={16} />
            <span>Dashboard</span>
          </button>
          <button
            type="button"
            className={`account-nav-tab ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            <Package size={16} />
            <span>Orders</span>
            {orders.length > 0 && <span className="tab-badge">{orders.length}</span>}
          </button>
          <button
            type="button"
            className={`account-nav-tab ${activeTab === "addresses" ? "active" : ""}`}
            onClick={() => setActiveTab("addresses")}
          >
            <MapPin size={16} />
            <span>Addresses</span>
          </button>
          <button
            type="button"
            className={`account-nav-tab ${activeTab === "details" ? "active" : ""}`}
            onClick={() => setActiveTab("details")}
          >
            <Lock size={16} />
            <span>Account Details</span>
          </button>
        </div>

        {/* TAB 1: DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="account-content-panel fade-in">
            <div className="dashboard-metrics-grid">
              <div className="metric-card">
                <div className="metric-icon orange">
                  <ShoppingBag size={22} />
                </div>
                <div className="metric-info">
                  <div className="metric-label">Total Orders</div>
                  <div className="metric-val">{orders.length || user.order_count || 0}</div>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon blue">
                  <MapPin size={22} />
                </div>
                <div className="metric-info">
                  <div className="metric-label">Default City</div>
                  <div className="metric-val" style={{ fontSize: "16px" }}>
                    {user.shipping?.city || user.billing?.city || "Not Set"}
                  </div>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon emerald">
                  <Phone size={22} />
                </div>
                <div className="metric-info">
                  <div className="metric-label">Support Helpline</div>
                  <div className="metric-val" style={{ fontSize: "16px" }}>+91 9251859361</div>
                </div>
              </div>
            </div>

            <div className="section-header-row">
              <div>
                <h2>Recent Order Activity</h2>
                <p>Track shipment progress and review invoice details.</p>
              </div>
              <button type="button" onClick={() => setActiveTab("orders")} className="order-view-btn">
                View All Orders <ArrowRight size={14} />
              </button>
            </div>

            {ordersLoading ? (
              <div style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>
                <RefreshCw className="animate-spin" size={18} style={{ display: "inline-block", marginRight: "8px" }} />
                Fetching recent orders...
              </div>
            ) : orders.length > 0 ? (
              <div className="orders-list-grid">
                {orders.slice(0, 3).map((order) => (
                  <div key={order.id} className="order-card">
                    <div className="order-card-header">
                      <div className="order-id-group">
                        <span className="order-id-text">Order #{order.number}</span>
                        <span className="order-date-text">{order.date?.split(" ")[0]}</span>
                      </div>
                      <span className={`order-status-pill status-${order.status}`}>
                        {order.status_name || order.status}
                      </span>
                    </div>

                    <div className="order-card-body">
                      {order.line_items?.map((item) => (
                        <div key={item.id} className="order-item-row">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="order-item-thumb" />
                          ) : (
                            <div className="order-item-thumb" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Package size={18} color="#94a3b8" />
                            </div>
                          )}
                          <div className="order-item-title">
                            {item.name}
                            <div className="order-item-qty">Qty: {item.quantity}</div>
                          </div>
                          <div className="order-item-price">₹{Number(item.total).toFixed(2)}</div>
                        </div>
                      ))}
                    </div>

                    <div className="order-card-footer">
                      <div className="order-total-group">
                        Total Amount:
                        <span className="order-total-val">₹{Number(order.total).toFixed(2)}</span>
                      </div>
                      <button type="button" onClick={() => setSelectedOrder(order)} className="order-view-btn">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state-box">
                <div className="empty-state-icon">
                  <Package size={26} />
                </div>
                <h3>No Orders Placed Yet</h3>
                <p>Browse our catalog of premium screws, bolts, and fasteners to place your first order.</p>
                <Link href="/shop" className="button btn-primary-save" style={{ textDecoration: "none", display: "inline-flex" }}>
                  Start Shopping
                </Link>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ALL ORDERS */}
        {activeTab === "orders" && (
          <div className="account-content-panel fade-in">
            <div className="section-header-row">
              <div>
                <h2>Your Order History</h2>
                <p>Complete record of your past fastener purchases and shipments.</p>
              </div>
              <button type="button" onClick={loadOrders} className="order-view-btn">
                <RefreshCw size={13} className={ordersLoading ? "animate-spin" : ""} /> Refresh
              </button>
            </div>

            {ordersLoading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                <RefreshCw className="animate-spin" size={20} style={{ display: "inline-block", marginRight: "8px" }} />
                Loading your orders...
              </div>
            ) : orders.length > 0 ? (
              <div className="orders-list-grid">
                {orders.map((order) => (
                  <div key={order.id} className="order-card">
                    <div className="order-card-header">
                      <div className="order-id-group">
                        <span className="order-id-text">Order #{order.number}</span>
                        <span className="order-date-text">{order.date?.split(" ")[0]}</span>
                      </div>
                      <span className={`order-status-pill status-${order.status}`}>
                        {order.status_name || order.status}
                      </span>
                    </div>

                    <div className="order-card-body">
                      {order.line_items?.map((item) => (
                        <div key={item.id} className="order-item-row">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="order-item-thumb" />
                          ) : (
                            <div className="order-item-thumb" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Package size={18} color="#94a3b8" />
                            </div>
                          )}
                          <div className="order-item-title">
                            {item.name}
                            <div className="order-item-qty">Qty: {item.quantity}</div>
                          </div>
                          <div className="order-item-price">₹{Number(item.total).toFixed(2)}</div>
                        </div>
                      ))}
                    </div>

                    <div className="order-card-footer">
                      <div className="order-total-group">
                        Payment: <b>{order.payment_method || "Online / COD"}</b> &bull; Total:
                        <span className="order-total-val">₹{Number(order.total).toFixed(2)}</span>
                      </div>
                      <button type="button" onClick={() => setSelectedOrder(order)} className="order-view-btn">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state-box">
                <div className="empty-state-icon">
                  <Package size={26} />
                </div>
                <h3>No Orders Found</h3>
                <p>You haven't placed any orders with this account yet.</p>
                <Link href="/shop" className="button btn-primary-save" style={{ textDecoration: "none", display: "inline-flex" }}>
                  Browse Fasteners
                </Link>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ADDRESSES */}
        {activeTab === "addresses" && (
          <div className="account-content-panel fade-in">
            <div className="section-header-row">
              <div>
                <h2>Saved Addresses</h2>
                <p>The following addresses are used on checkout and for delivery invoicing by default.</p>
              </div>
            </div>

            {addressFeedback.success && (
              <div className="account-alert account-alert-success">
                <CheckCircle2 size={16} /> {addressFeedback.success}
              </div>
            )}
            {addressFeedback.error && (
              <div className="account-alert account-alert-error">
                <AlertCircle size={16} /> {addressFeedback.error}
              </div>
            )}

            <div className="addresses-grid">
              {/* Billing Address Card */}
              <div className="address-card">
                <div>
                  <div className="address-card-header">
                    <h3>
                      <CreditCard size={18} color="#f97316" /> Billing Address
                    </h3>
                    <button type="button" onClick={() => startEditAddress("billing")} className="address-edit-link">
                      <Edit2 size={13} /> Edit
                    </button>
                  </div>

                  <div className="address-body">
                    {user.billing?.address_1 ? (
                      <>
                        <strong>{user.billing.first_name} {user.billing.last_name}</strong>
                        {user.billing.company && <div>{user.billing.company}</div>}
                        <div>{user.billing.address_1}</div>
                        {user.billing.address_2 && <div>{user.billing.address_2}</div>}
                        <div>
                          {user.billing.city}{user.billing.state ? `, ${user.billing.state}` : ""} {user.billing.postcode}
                        </div>
                        <div>{user.billing.country || "India"}</div>
                        {user.billing.phone && <div className="address-meta-line"><Phone size={12} style={{ display: "inline", marginRight: "4px" }} />{user.billing.phone}</div>}
                      </>
                    ) : (
                      <span className="not-set">You have not set up a billing address yet.</span>
                    )}
                  </div>
                </div>

                {editingAddressType === "billing" && (
                  <form onSubmit={handleSaveAddress} className="address-edit-form">
                    <div className="form-row-two">
                      <div className="account-input-group">
                        <label>First Name</label>
                        <input
                          type="text"
                          value={addressForm.first_name}
                          onChange={(e) => setAddressForm({ ...addressForm, first_name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="account-input-group">
                        <label>Last Name</label>
                        <input
                          type="text"
                          value={addressForm.last_name}
                          onChange={(e) => setAddressForm({ ...addressForm, last_name: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="account-input-group">
                      <label>Company Name (Optional / GST)</label>
                      <input
                        type="text"
                        value={addressForm.company}
                        onChange={(e) => setAddressForm({ ...addressForm, company: e.target.value })}
                      />
                    </div>

                    <div className="account-input-group">
                      <label>Street Address</label>
                      <input
                        type="text"
                        value={addressForm.address_1}
                        placeholder="House / Flat No., Road / Colony"
                        onChange={(e) => setAddressForm({ ...addressForm, address_1: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-row-two">
                      <div className="account-input-group">
                        <label>City</label>
                        <input
                          type="text"
                          value={addressForm.city}
                          onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                          required
                        />
                      </div>
                      <div className="account-input-group">
                        <label>State</label>
                        <input
                          type="text"
                          value={addressForm.state}
                          placeholder="e.g. Rajasthan"
                          onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-row-two">
                      <div className="account-input-group">
                        <label>PIN Code</label>
                        <input
                          type="text"
                          value={addressForm.postcode}
                          onChange={(e) => setAddressForm({ ...addressForm, postcode: e.target.value })}
                          required
                        />
                      </div>
                      <div className="account-input-group">
                        <label>Phone Number</label>
                        <input
                          type="text"
                          value={addressForm.phone}
                          onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="address-form-actions">
                      <button type="submit" disabled={addressLoading} className="btn-primary-save">
                        {addressLoading ? "Saving..." : "Save Billing Address"}
                      </button>
                      <button type="button" onClick={() => setEditingAddressType(null)} className="btn-secondary-cancel">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Shipping Address Card */}
              <div className="address-card">
                <div>
                  <div className="address-card-header">
                    <h3>
                      <MapPin size={18} color="#0284c7" /> Shipping Address
                    </h3>
                    <button type="button" onClick={() => startEditAddress("shipping")} className="address-edit-link">
                      <Edit2 size={13} /> Edit
                    </button>
                  </div>

                  <div className="address-body">
                    {user.shipping?.address_1 ? (
                      <>
                        <strong>{user.shipping.first_name} {user.shipping.last_name}</strong>
                        {user.shipping.company && <div>{user.shipping.company}</div>}
                        <div>{user.shipping.address_1}</div>
                        {user.shipping.address_2 && <div>{user.shipping.address_2}</div>}
                        <div>
                          {user.shipping.city}{user.shipping.state ? `, ${user.shipping.state}` : ""} {user.shipping.postcode}
                        </div>
                        <div>{user.shipping.country || "India"}</div>
                        {user.shipping.phone && <div className="address-meta-line"><Phone size={12} style={{ display: "inline", marginRight: "4px" }} />{user.shipping.phone}</div>}
                      </>
                    ) : (
                      <span className="not-set">You have not set up a shipping address yet.</span>
                    )}
                  </div>
                </div>

                {editingAddressType === "shipping" && (
                  <form onSubmit={handleSaveAddress} className="address-edit-form">
                    <div className="form-row-two">
                      <div className="account-input-group">
                        <label>First Name</label>
                        <input
                          type="text"
                          value={addressForm.first_name}
                          onChange={(e) => setAddressForm({ ...addressForm, first_name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="account-input-group">
                        <label>Last Name</label>
                        <input
                          type="text"
                          value={addressForm.last_name}
                          onChange={(e) => setAddressForm({ ...addressForm, last_name: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="account-input-group">
                      <label>Company Name (Optional)</label>
                      <input
                        type="text"
                        value={addressForm.company}
                        onChange={(e) => setAddressForm({ ...addressForm, company: e.target.value })}
                      />
                    </div>

                    <div className="account-input-group">
                      <label>Street Delivery Address</label>
                      <input
                        type="text"
                        value={addressForm.address_1}
                        placeholder="House / Factory / Warehouse address"
                        onChange={(e) => setAddressForm({ ...addressForm, address_1: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-row-two">
                      <div className="account-input-group">
                        <label>City</label>
                        <input
                          type="text"
                          value={addressForm.city}
                          onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                          required
                        />
                      </div>
                      <div className="account-input-group">
                        <label>State</label>
                        <input
                          type="text"
                          value={addressForm.state}
                          placeholder="e.g. Rajasthan"
                          onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-row-two">
                      <div className="account-input-group">
                        <label>PIN Code</label>
                        <input
                          type="text"
                          value={addressForm.postcode}
                          onChange={(e) => setAddressForm({ ...addressForm, postcode: e.target.value })}
                          required
                        />
                      </div>
                      <div className="account-input-group">
                        <label>Contact Phone</label>
                        <input
                          type="text"
                          value={addressForm.phone}
                          onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="address-form-actions">
                      <button type="submit" disabled={addressLoading} className="btn-primary-save">
                        {addressLoading ? "Saving..." : "Save Shipping Address"}
                      </button>
                      <button type="button" onClick={() => setEditingAddressType(null)} className="btn-secondary-cancel">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ACCOUNT DETAILS */}
        {activeTab === "details" && (
          <div className="account-content-panel fade-in">
            <div className="section-header-row">
              <div>
                <h2>Account Information</h2>
                <p>Update your personal details and security password.</p>
              </div>
            </div>

            {profileFeedback.success && (
              <div className="account-alert account-alert-success">
                <CheckCircle2 size={16} /> {profileFeedback.success}
              </div>
            )}
            {profileFeedback.error && (
              <div className="account-alert account-alert-error">
                <AlertCircle size={16} /> {profileFeedback.error}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="account-details-form">
              <div className="form-row-two">
                <div className="account-input-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    value={profileForm.first_name}
                    onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                    required
                  />
                </div>
                <div className="account-input-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={profileForm.last_name}
                    onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="account-input-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  required
                />
              </div>

              <div className="password-change-box">
                <h3>
                  <Lock size={16} color="#f97316" /> Password Change (Leave blank to keep unchanged)
                </h3>

                <div className="account-input-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    value={profileForm.current_password}
                    placeholder="Enter current password"
                    onChange={(e) => setProfileForm({ ...profileForm, current_password: e.target.value })}
                  />
                </div>

                <div className="form-row-two">
                  <div className="account-input-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      value={profileForm.new_password}
                      placeholder="Minimum 6 characters"
                      onChange={(e) => setProfileForm({ ...profileForm, new_password: e.target.value })}
                    />
                  </div>
                  <div className="account-input-group">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      value={profileForm.confirm_password}
                      placeholder="Repeat new password"
                      onChange={(e) => setProfileForm({ ...profileForm, confirm_password: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div>
                <button type="submit" disabled={profileLoading} className="btn-primary-save" style={{ padding: "12px 24px" }}>
                  {profileLoading ? "Saving Changes..." : "Save Profile Details"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ORDER DETAILS MODAL */}
        {selectedOrder && (
          <div className="order-modal-backdrop" onClick={() => setSelectedOrder(null)}>
            <div className="order-modal-card fade-in" onClick={(e) => e.stopPropagation()}>
              <button type="button" onClick={() => setSelectedOrder(null)} className="modal-close-btn">
                <X size={18} />
              </button>

              <div style={{ marginBottom: "20px", borderBottom: "1px solid #e2e8f0", paddingBottom: "16px" }}>
                <h3 style={{ margin: "0 0 4px", fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
                  Order Details #{selectedOrder.number}
                </h3>
                <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                  Placed on {selectedOrder.date} &bull; Status:{" "}
                  <span className={`order-status-pill status-${selectedOrder.status}`}>
                    {selectedOrder.status_name || selectedOrder.status}
                  </span>
                </p>
              </div>

              <div style={{ display: "grid", gap: "12px", marginBottom: "24px" }}>
                <div style={{ fontWeight: 700, fontSize: "14px", color: "#1e293b" }}>Purchased Items:</div>
                {selectedOrder.line_items?.map((item) => (
                  <div key={item.id} className="order-item-row" style={{ padding: "8px 0", borderBottom: "1px dashed #e2e8f0" }}>
                    <div style={{ flex: 1, fontSize: "13px", fontWeight: 600 }}>
                      {item.name} <span style={{ color: "#64748b", fontWeight: 400 }}>&times; {item.quantity}</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: "13px" }}>₹{Number(item.total).toFixed(2)}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", background: "#f8fafc", padding: "16px", borderRadius: "10px", marginBottom: "20px" }}>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "#64748b", marginBottom: "4px" }}>
                    Shipping Address
                  </div>
                  <div style={{ fontSize: "12px", color: "#334155", lineHeight: 1.6 }}>
                    {selectedOrder.shipping?.first_name} {selectedOrder.shipping?.last_name}<br />
                    {selectedOrder.shipping?.address_1}<br />
                    {selectedOrder.shipping?.city}, {selectedOrder.shipping?.state} {selectedOrder.shipping?.postcode}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "#64748b", marginBottom: "4px" }}>
                    Payment Method
                  </div>
                  <div style={{ fontSize: "12px", color: "#334155", lineHeight: 1.6 }}>
                    <b>{selectedOrder.payment_method || "Cash on delivery"}</b><br />
                    Total Paid: <b>₹{Number(selectedOrder.total).toFixed(2)}</b>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <button type="button" onClick={() => setSelectedOrder(null)} className="btn-secondary-cancel">
                  Close Window
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW B: SIGN IN / REGISTER FORM (NOT LOGGED IN)
  // =========================================================================
  return (
    <div className="account-portal-wrapper">
      <div className="account-container">
        <div className="account-tab-buttons">
          <button
            type="button"
            className={`account-tab-btn ${authMode === "login" ? "active" : ""}`}
            onClick={() => {
              setAuthMode("login");
              setAuthError("");
            }}
          >
            <UserCheck size={16} />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            className={`account-tab-btn ${authMode === "register" ? "active" : ""}`}
            onClick={() => {
              setAuthMode("register");
              setAuthError("");
            }}
          >
            <PackageCheck size={16} />
            <span>Create Account</span>
          </button>
        </div>

        <div className="account-card-body">
          {authSuccess && (
            <div className="account-alert account-alert-success">
              <CheckCircle2 size={16} /> {authSuccess}
            </div>
          )}
          {authError && (
            <div className="account-alert account-alert-error">
              <AlertCircle size={16} /> {authError}
            </div>
          )}

          {authMode === "login" ? (
            <div className="fade-in">
              <div className="account-form-header">
                <div className="form-icon">
                  <UserCheck size={26} />
                </div>
                <h2>Sign in to screwnet</h2>
                <p>Access your orders, saved delivery addresses, and track shipments live.</p>
              </div>

              <form onSubmit={handleLogin} className="account-form-grid">
                <div className="form-field">
                  <label htmlFor="auth-email">Email Address or Username</label>
                  <div className="input-with-icon">
                    <Mail size={17} className="field-icon" />
                    <input
                      id="auth-email"
                      type="text"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div className="form-field">
                  <div className="field-label-row">
                    <label htmlFor="auth-password">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowLostPassword(true);
                        setLostEmail(loginEmail);
                      }}
                      className="forgot-password-link"
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="input-with-icon">
                    <Lock size={17} className="field-icon" />
                    <input
                      id="auth-password"
                      type={showPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button className="button account-submit-btn" type="submit" disabled={authLoading}>
                  {authLoading ? "Signing In..." : "Sign In to Account"}
                </button>
              </form>
            </div>
          ) : (
            <div className="fade-in">
              <div className="account-form-header">
                <div className="form-icon">
                  <PackageCheck size={26} />
                </div>
                <h2>Create screwnet Account</h2>
                <p>Register for faster checkout, order history & business GST invoicing.</p>
              </div>

              <form onSubmit={handleRegister} className="account-form-grid">
                <div className="form-row-two" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="form-field">
                    <label>First Name</label>
                    <input
                      type="text"
                      value={regFirstName}
                      onChange={(e) => setRegFirstName(e.target.value)}
                      placeholder="First name"
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Last Name</label>
                    <input
                      type="text"
                      value={regLastName}
                      onChange={(e) => setRegLastName(e.target.value)}
                      placeholder="Last name"
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="reg-email-input">Email Address</label>
                  <div className="input-with-icon">
                    <Mail size={17} className="field-icon" />
                    <input
                      id="reg-email-input"
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="reg-phone-input">Phone Number (Optional)</label>
                  <div className="input-with-icon">
                    <Phone size={17} className="field-icon" />
                    <input
                      id="reg-phone-input"
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="10-digit mobile number"
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="reg-password-input">Create Password</label>
                  <div className="input-with-icon">
                    <Lock size={17} className="field-icon" />
                    <input
                      id="reg-password-input"
                      type={showPassword ? "text" : "password"}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button className="button account-submit-btn" type="submit" disabled={authLoading}>
                  {authLoading ? "Creating Account..." : "Create Account"}
                </button>
              </form>
            </div>
          )}
        </div>

        <div className="account-security-footer">
          <ShieldCheck size={18} />
          <span>Protected with 256-bit SSL encryption. We never share your data.</span>
        </div>
      </div>

      {/* Lost Password Modal */}
      {showLostPassword && (
        <div className="order-modal-backdrop" onClick={() => setShowLostPassword(false)}>
          <div className="order-modal-card fade-in" style={{ maxWidth: "440px" }} onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setShowLostPassword(false)} className="modal-close-btn">
              <X size={18} />
            </button>
            <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 700 }}>Reset Your Password</h3>
            <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#64748b" }}>
              Enter your registered email address to receive password reset instructions.
            </p>

            {lostMsg && (
              <div className="account-alert account-alert-success" style={{ marginBottom: "14px" }}>
                <CheckCircle2 size={15} /> {lostMsg}
              </div>
            )}

            <form onSubmit={handleLostPassword} style={{ display: "grid", gap: "14px" }}>
              <div className="account-input-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={lostEmail}
                  onChange={(e) => setLostEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                <button type="submit" disabled={lostLoading} className="btn-primary-save">
                  {lostLoading ? "Sending..." : "Send Reset Link"}
                </button>
                <button type="button" onClick={() => setShowLostPassword(false)} className="btn-secondary-cancel">
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
