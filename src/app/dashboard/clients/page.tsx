"use client";

import { useState, useEffect } from "react";
import { getClients, createClient, updateClient, deleteClient } from "@/actions/client";

interface ClientData {
  _id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  
  const [showModal, setShowModal] = useState(false);
  const [editClient, setEditClient] = useState<ClientData | null>(null);
  const [formData, setFormData] = useState({ name: "", status: "ACTIVE" as "ACTIVE" | "INACTIVE" });
  const [saving, setSaving] = useState(false);

  async function fetchClients() {
    setLoading(true);
    const data = await getClients();
    setClients(data);
    setLoading(false);
  }

  useEffect(() => {
    let mounted = true;
    getClients().then((data) => {
      if (mounted) {
        setClients(data);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  function handleAdd() {
    setEditClient(null);
    setFormData({ name: "", status: "ACTIVE" });
    setShowModal(true);
  }

  function handleEdit(client: ClientData) {
    setEditClient(client);
    setFormData({ name: client.name, status: client.status });
    setShowModal(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this client?")) return;
    await deleteClient(id);
    fetchClients();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    setSaving(true);
    if (editClient) {
      await updateClient(editClient._id, formData);
    } else {
      await createClient(formData);
    }
    setSaving(false);
    setShowModal(false);
    fetchClients();
  }

  const filteredClients = clients
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    .filter((c) => statusFilter === "ALL" || c.status === statusFilter)
    .sort((a, b) => {
      if (sortOrder === "asc") return a.name.localeCompare(b.name);
      return b.name.localeCompare(a.name);
    });

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Clients</h1>
        <p className="page-subtitle">Manage your clients here.</p>
      </div>

      <div className="page-body">
        <div className="section-header" style={{ flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", flex: 1 }}>
            <input
              type="text"
              placeholder="Search clients..."
              className="form-input"
              style={{ maxWidth: 300, padding: "10px 14px" }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="form-select"
              style={{ width: "auto", padding: "10px 36px 10px 14px" }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "ALL" | "ACTIVE" | "INACTIVE")}
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            <button
              className="btn-secondary"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              Sort Name {sortOrder === "asc" ? "↑" : "↓"}
            </button>
          </div>
          <button className="add-task-btn" onClick={handleAdd}>
            ➕ Add Client
          </button>
        </div>

        {loading ? (
          <div className="task-list">
            {[1, 2].map((i) => (
              <div key={i} className="skeleton" style={{ height: 80, marginBottom: 10 }} />
            ))}
          </div>
        ) : filteredClients.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>👥</div>
            <h3>No clients found</h3>
          </div>
        ) : (
          <div className="task-list">
            {filteredClients.map((client) => (
              <div key={client._id} className={`task-card ${client.status === "INACTIVE" ? "done" : ""}`}>
                <div className="task-content">
                  <h3 className="task-title">{client.name}</h3>
                  <div className="task-meta">
                    <span className="task-tag" style={{ color: client.status === "ACTIVE" ? "var(--status-done)" : "var(--text-muted)" }}>
                      {client.status === "ACTIVE" ? "🟢" : "⚪"} {client.status}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-secondary" style={{ padding: "6px 12px" }} onClick={() => handleEdit(client)}>Edit</button>
                  <button className="btn-danger" style={{ padding: "6px 12px" }} onClick={() => handleDelete(client._id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editClient ? "Edit Client" : "Add Client"}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Client Name *</label>
                  <input
                    className="form-input"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as "ACTIVE" | "INACTIVE" })}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-save" disabled={saving || !formData.name.trim()}>
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
