import React, { useEffect, useMemo, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import "./App.css";

import Dashboard from "./forms/Dashboard";
import Products from "./forms/Products";
import Operations from "./forms/Operations";
import CreateSalesOrder from "./forms/CreateSalesOrder";
import Warehouses from "./forms/Warehouses";
import Reports from "./forms/Reports";
import Automation from "./forms/Automation";
import PurchaseOrders from "./forms/PurchaseOrders";
import AdminPanel from "./forms/AdminPanel";

import Customers from './forms/Customers';
import Returns from './forms/Returns';
import StockAlerts from './forms/StockAlerts';
import Notifications from './forms/Notifications';
import LocalAIPage from "./pages/LocalAIPage";
import SalesOrderList from "./forms/SalesOrderList";

import { smartErpApi } from "./services/smartErpApi";
import { LocalAIProvider } from "./context/LocalAIContext";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState(localStorage.getItem("erp_role") || "");
  const [unreadCount, setUnreadCount] = useState(0);
  const [prevCount, setPrevCount] = useState(0);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("erp_token");
    setIsAuthenticated(!!token);

    const handleUnauthorized = () => {
      setRole("");
      setIsAuthenticated(false);
    };

    window.addEventListener("erp:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("erp:unauthorized", handleUnauthorized);
  }, []);

  const handleLoginSuccess = (payload) => {
    localStorage.setItem("erp_token", payload.accessToken);
    localStorage.setItem("erp_role", payload.role || "");
    setRole(payload.role || "");
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("erp_token");
    localStorage.removeItem("erp_role");
    setRole("");
    setIsAuthenticated(false);
  };

  // poll unread notification count every 30 seconds
  useEffect(() => {
    let interval;
    const fetchCount = async () => {
      try {
        const res = await smartErpApi.notificationsUnreadCount();
        const c = res.data?.count ?? res.data?.Count ?? 0;
        setPrevCount(unreadCount);
        setUnreadCount(c);
        if (c > unreadCount) {
          setToastMessage(`You have ${c - unreadCount} new notification${c - unreadCount > 1 ? 's' : ''}`);
        }
      } catch (e) {
        // ignore
      }
    };
    if (isAuthenticated) {
      fetchCount();
      interval = setInterval(fetchCount, 30000);
    }
    return () => clearInterval(interval);
  }, [isAuthenticated, unreadCount]);

  const navItems = useMemo(() => {
    const base = [
      { path: "/dashboard", label: "Dashboard" },
      { path: "/products", label: "Products" },
      { path: "/operations", label: "Order Flow" },
      { path: "/sales-orders/list", label: "Sales Order List" },
      { path: "/sales-orders/create", label: "Create Sales Order" },
      { path: "/purchase-orders", label: "Purchase Orders" },
      { path: "/customers", label: "Customers" },
      { path: "/returns", label: "Returns" },
      { path: "/stock-alerts", label: "Alerts" },
      { path: "/notifications", label: `Notifications${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
      { path: "/warehouses", label: "Warehouses" },
      { path: "/reports", label: "Reports" },
      { path: "/automation", label: "Automation" },
      { path: "/local-ai", label: "Local AI" }
    ];

    if (role === "Admin") {
      base.splice(1, 0, { path: "/admin", label: "Admin" });
    }

    return base;
  }, [role]);

  return (
    <LocalAIProvider>
      <Router>
        {!isAuthenticated ? (
          <LoginPage onLoginSuccess={handleLoginSuccess} />
        ) : (
          <div className="app-shell">
            <Sidebar navItems={navItems} role={role} onLogout={handleLogout} />
            <main className="app-main">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/admin" element={role === "Admin" ? <AdminPanel /> : <Navigate to="/dashboard" replace />} />
                <Route path="/products" element={<Products />} />
                <Route path="/operations" element={<Operations />} />
                <Route path="/purchase-orders" element={<PurchaseOrders />} />
                <Route path="/po" element={<PurchaseOrders />} />
                <Route path="/sales-orders" element={<Navigate to="/sales-orders/list" replace />} />
                <Route path="/sales-orders/list" element={<SalesOrderList />} />
                <Route path="/sales-orders/create" element={<CreateSalesOrder />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/returns" element={<Returns />} />
                <Route path="/stock-alerts" element={<StockAlerts />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/warehouses" element={<Warehouses />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/automation" element={<Automation />} />
                <Route path="/local-ai" element={<LocalAIPage />} />
              </Routes>
              {toastMessage && (
                <div className="toast show position-fixed bottom-0 end-0 m-3" role="alert" aria-live="assertive" aria-atomic="true">
                  <div className="toast-header">
                    <strong className="me-auto">ERP</strong>
                    <button type="button" className="btn-close" onClick={() => setToastMessage("")}></button>
                  </div>
                  <div className="toast-body">{toastMessage}</div>
                </div>
              )}
            </main>
          </div>
        )}
      </Router>
    </LocalAIProvider>
  );
}

function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [otpCode, setOtpCode] = useState("");
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [mfaMessage, setMfaMessage] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    smartErpApi.initialize().catch(() => {});
  }, []);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await smartErpApi.login({ username, password });
      if (res.data.requiresMfa) {
        setRequiresMfa(true);
        setMfaMessage(res.data.message || "MFA verification required. OTP sent to your email.");
        setDevOtp(res.data.devOtp || "");
      } else {
        onLoginSuccess({ accessToken: res.data.accessToken, role: res.data.role });
      }
    } catch (e) {
      setError(e?.response?.data || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMfa = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await smartErpApi.verifyMfa({ username, otpCode });
      onLoginSuccess({ accessToken: res.data.accessToken, role: res.data.role });
    } catch (e) {
      setError(e?.response?.data || "MFA verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">Smart ERP</div>
        <h1 className="login-title">Enterprise Access</h1>
        <p className="login-subtitle">Authenticate to open operations, automation, and analytics.</p>

        {!requiresMfa ? (
          <form onSubmit={handleLogin} className="login-form">
            <label className="form-label" htmlFor="userId">User ID</label>
            <input id="userId" type="text" className="form-control" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />

            <label className="form-label mt-3" htmlFor="password">Password</label>
            <input id="password" type="password" className="form-control" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />

            {error && <div className="alert alert-danger mt-3 mb-0 py-2">{error}</div>}

            <button type="submit" className="btn btn-primary w-100 mt-4" disabled={loading}>
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyMfa} className="login-form">
            <div className="alert alert-info py-2">{mfaMessage || "MFA required. Check your email for OTP."} {devOtp ? `Fallback OTP: ${devOtp}` : ""}</div>
            <label className="form-label" htmlFor="otpCode">OTP Code</label>
            <input id="otpCode" type="text" className="form-control" value={otpCode} onChange={(event) => setOtpCode(event.target.value)} placeholder="Enter OTP" />
            {error && <div className="alert alert-danger mt-3 mb-0 py-2">{error}</div>}
            <button type="submit" className="btn btn-primary w-100 mt-4" disabled={loading}>
              {loading ? "Verifying..." : "Verify MFA"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Sidebar({ navItems, role, onLogout }) {
  return (
    <aside className="app-sidebar">
      <div className="sidebar-header">
        <h4 className="fw-bold m-0">ERP Pro</h4>
        <small>{role}</small>
      </div>

      <ul className="nav flex-column gap-2 mt-3">
        {navItems.map((item) => (
          <li key={item.path} className="nav-item">
            <Link className="nav-link sidebar-link" to={item.path}>{item.label}</Link>
          </li>
        ))}
      </ul>

      <button className="btn btn-outline-light mt-auto" onClick={onLogout}>Logout</button>
    </aside>
  );
}
