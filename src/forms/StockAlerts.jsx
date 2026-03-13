import React, { useEffect, useState } from "react";
import { smartErpApi } from "../services/smartErpApi";

export default function StockAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await smartErpApi.stockAlerts();
      setAlerts(res.data || []);
    } catch (err) {
      setMessage(err?.response?.data || "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAlerts(); }, []);

  const formatShortDate = (value) => {
    if (!value) return "-";
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

  return (
    <div className="container-fluid py-4" style={{ background: "#f5f7fb", minHeight: "100vh" }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold">Stock Alerts</h2>
          <p className="text-muted mb-0">Configure and view inventory alerts</p>
        </div>
      </div>

      {message && <div className={`alert alert-danger py-2`}>{message}</div>}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="card border-0 shadow-sm rounded-4 p-4">
          <h5 className="fw-bold mb-3">Alert List</h5>
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Item</th>
                  <th>Warehouse</th>
                  <th>Alert Type</th>
                  <th>Reorder Point</th>
                  <th>Severity</th>
                  <th>Triggered</th>
                  <th>Last Checked</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((a) => (
                  <tr key={a.id}>
                    <td>{a.itemCode || a.itemName || 'N/A'}</td>
                    <td>{a.warehouseName || 'N/A'}</td>
                    <td>{a.alertType || 'Standard'}</td>
                    <td>{a.reorderPoint ?? a.minQuantity ?? 'N/A'}</td>
                    <td>
                      <span className={`badge ${a.severity === 'High' ? 'bg-danger' : a.severity === 'Medium' ? 'bg-warning' : 'bg-info'}`}>
                        {a.severity || 'Normal'}
                      </span>
                    </td>
                    <td>{a.isTriggered ? 'Yes' : 'No'}</td>
                    <td>{formatShortDate(a.lastChecked || a.lastTriggered)}</td>
                  </tr>
                ))}
                {alerts.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-4">No alerts defined.</td>
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
