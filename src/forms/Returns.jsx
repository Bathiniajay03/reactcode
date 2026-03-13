import React, { useEffect, useState } from "react";
import api from "../services/apiClient";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2
});

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return value;
  return currencyFormatter.format(parsed);
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hourCycle: "h12"
  });
};

const getStatusBadge = (status, isApproved) => {
  const base = ["badge"];
  if (status === "Approved" || isApproved) base.push("bg-success");
  else if (status === "Pending") base.push("bg-warning", "text-dark");
  else if (status === "Rejected" || status === "Refunded") base.push("bg-danger");
  else base.push("bg-secondary");
  return base.join(" ");
};

const getStatusLabel = (status, isApproved) => {
  if (status) return status;
  if (isApproved) return "Approved";
  return "Pending";
};

export default function Returns() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const res = await api.get("/returns");
      setReturns(res.data || []);
    } catch (err) {
      setMessage(err?.response?.data || "Failed to load returns");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReturns(); }, []);

  return (
    <div className="container-fluid py-4" style={{ background: "#f5f7fb", minHeight: "100vh" }}>
      <div className="mb-4">
        <h2 className="fw-bold">Returns</h2>
        <p className="text-muted mb-0">Manage return orders</p>
      </div>

      {message && <div className={`alert alert-danger py-2`}>{message}</div>}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="card border-0 shadow-sm rounded-4 p-4">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Return #</th>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Refund</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {returns.map((ret) => (
                  <tr key={ret.id}>
                    <td>{ret.returnNumber || `RMA-${ret.id}`}</td>
                    <td>{ret.orderNumber || ret.salesOrderId}</td>
                    <td>{ret.customerName || 'N/A'}</td>
                    <td>{formatCurrency(ret.totalAmount)}</td>
                    <td>{formatCurrency(ret.refundAmount)}</td>
                    <td>{ret.returnReason || 'N/A'}</td>
                    <td>
                      <span className={getStatusBadge(ret.status, ret.isApproved)}>
                        {getStatusLabel(ret.status, ret.isApproved)}
                      </span>
                    </td>
                    <td>{formatDateTime(ret.returnDate || ret.createdAt)}</td>
                  </tr>
                ))}
                {returns.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center text-muted">No returns found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
