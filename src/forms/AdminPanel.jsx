import React, { useState } from "react";
import { smartErpApi } from "../services/smartErpApi";

export default function AdminPanel() {

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "Operator",
    mfaEnabled: false
  });

  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {

      const res = await smartErpApi.registerUser(form);

      setResult(`User created: ${res.data.username} (${res.data.role})`);

      setForm({
        username: "",
        email: "",
        password: "",
        role: "Operator",
        mfaEnabled: false
      });

    } catch (err) {

      setResult(
        err?.response?.data ||
        "User registration failed"
      );

    }

    setLoading(false);
  };

  return (
    <div className="container-fluid py-4">

      <div className="card shadow-sm border-0 p-4" style={{ maxWidth: 900 }}>

        <h4 className="fw-bold">Admin & Security</h4>
        <p className="text-muted">Create ERP users and manage access.</p>

        {result && (
          <div className="alert alert-info">{result}</div>
        )}

        <form
          className="row g-3"
          onSubmit={handleSubmit}
          autoComplete="off"
        >

          <div className="col-md-4">
            <label className="form-label">Username</label>
            <input
              name="username"
              autoComplete="new-username"
              className="form-control"
              value={form.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-md-4">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              className="form-control"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-md-4">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              autoComplete="off"
              className="form-control"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-md-4">
            <label className="form-label">Role</label>
            <select
              name="role"
              className="form-select"
              value={form.role}
              onChange={handleChange}
            >
              <option>Admin</option>
              <option>Warehouse Manager</option>
              <option>Operator</option>
              <option>Finance Manager</option>
              <option>Robot Supervisor</option>
            </select>
          </div>

          <div className="col-12 d-flex align-items-center gap-2">
            <input
              id="mfaEnabled"
              name="mfaEnabled"
              type="checkbox"
              checked={form.mfaEnabled}
              onChange={handleChange}
            />
            <label htmlFor="mfaEnabled" className="form-label m-0">
              Enable MFA
            </label>
          </div>

          <div className="col-12">
            <button
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create User"}
            </button>
          </div>

        </form>

      </div>

    </div>
  );
}