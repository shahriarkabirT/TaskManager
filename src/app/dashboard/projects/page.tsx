"use client";

import { useState, useEffect } from "react";
import { getProjects, createProject, updateProject, deleteProject } from "@/actions/project";
import { getClients } from "@/actions/client";

interface ClientData {
  _id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
}

interface ProjectData {
  _id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  clientId?: { _id: string; name: string } | null;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState<ProjectData | null>(null);
  const [formData, setFormData] = useState({ name: "", status: "ACTIVE" as "ACTIVE" | "INACTIVE", clientId: "" });
  const [saving, setSaving] = useState(false);



  useEffect(() => {
    let mounted = true;
    Promise.all([getProjects(), getClients()]).then(([p, c]) => {
      if (mounted) {
        setProjects(p);
        setClients(c);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  function handleAdd() {
    setEditProject(null);
    setFormData({ name: "", status: "ACTIVE", clientId: "" });
    setShowModal(true);
  }

  function handleEdit(project: ProjectData) {
    setEditProject(project);
    setFormData({ 
      name: project.name, 
      status: project.status, 
      clientId: project.clientId?._id || "" 
    });
    setShowModal(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this project?")) return;
    await deleteProject(id);
    const p = await getProjects();
    setProjects(p);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    setSaving(true);
    const payload = {
      name: formData.name,
      status: formData.status,
      clientId: formData.clientId || null
    };

    if (editProject) {
      await updateProject(editProject._id, payload);
    } else {
      await createProject(payload);
    }
    setSaving(false);
    setShowModal(false);
    const p = await getProjects();
    setProjects(p);
  }

  const filteredProjects = projects
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.clientId?.name.toLowerCase().includes(search.toLowerCase()))
    .filter((p) => statusFilter === "ALL" || p.status === statusFilter)
    .sort((a, b) => {
      if (sortOrder === "asc") return a.name.localeCompare(b.name);
      return b.name.localeCompare(a.name);
    });

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Projects</h1>
        <p className="page-subtitle">Manage your projects and link them to clients.</p>
      </div>

      <div className="page-body">
        <div className="section-header" style={{ flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", flex: 1 }}>
            <input
              type="text"
              placeholder="Search projects..."
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
            ➕ Add Project
          </button>
        </div>

        {loading ? (
          <div className="task-list">
            {[1, 2].map((i) => (
              <div key={i} className="skeleton" style={{ height: 80, marginBottom: 10 }} />
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>📁</div>
            <h3>No projects found</h3>
          </div>
        ) : (
          <div className="task-list">
            {filteredProjects.map((project) => (
              <div key={project._id} className={`task-card ${project.status === "INACTIVE" ? "done" : ""}`}>
                <div className="task-content">
                  <h3 className="task-title">{project.name}</h3>
                  <div className="task-description">
                    {project.clientId ? `Client: ${project.clientId.name}` : "No Client Associated"}
                  </div>
                  <div className="task-meta" style={{ marginTop: 8 }}>
                    <span className="task-tag" style={{ color: project.status === "ACTIVE" ? "var(--status-done)" : "var(--text-muted)" }}>
                      {project.status === "ACTIVE" ? "🟢" : "⚪"} {project.status}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-secondary" style={{ padding: "6px 12px" }} onClick={() => handleEdit(project)}>Edit</button>
                  <button className="btn-danger" style={{ padding: "6px 12px" }} onClick={() => handleDelete(project._id)}>Delete</button>
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
              <h2 className="modal-title">{editProject ? "Edit Project" : "Add Project"}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Project Name *</label>
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
                  <label className="form-label">Client (Optional)</label>
                  <select
                    className="form-select"
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  >
                    <option value="">-- No Client --</option>
                    {clients.filter(c => c.status === "ACTIVE" || c._id === editProject?.clientId?._id).map(c => (
                      <option key={c._id} value={c._id}>{c.name} {c.status === "INACTIVE" ? "(Inactive)" : ""}</option>
                    ))}
                  </select>
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
