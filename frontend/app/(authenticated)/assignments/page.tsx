"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";

interface Assignment {
  id: string;
  project_id: string;
  member_id: string;
  allocation_rate: number;
  start_date: string | null;
  end_date: string | null;
  role: string | null;
  is_primary: boolean;
  project_name: string | null;
  member_name: string | null;
}

interface AssignmentListResponse {
  items: Assignment[];
  total: number;
}

interface SelectOption {
  id: string;
  name: string;
}

export default function AssignmentsPage() {
  const [data, setData] = useState<AssignmentListResponse | null>(null);
  const [projects, setProjects] = useState<SelectOption[]>([]);
  const [members, setMembers] = useState<SelectOption[]>([]);
  const [filterProject, setFilterProject] = useState("");
  const [filterMember, setFilterMember] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string | boolean>>({});

  const fetchAssignments = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterProject) params.set("project_id", filterProject);
    if (filterMember) params.set("member_id", filterMember);
    const qs = params.toString();
    const res = await api.get<AssignmentListResponse>(
      `/api/v1/project-assignments${qs ? `?${qs}` : ""}`
    );
    setData(res);
  }, [filterProject, filterMember]);

  const fetchOptions = useCallback(async () => {
    const [pRes, mRes] = await Promise.all([
      api.get<{ items: SelectOption[] }>("/api/v1/projects?limit=100"),
      api.get<{ items: SelectOption[] }>("/api/v1/members?limit=100"),
    ]);
    setProjects(pRes.items);
    setMembers(mRes.items);
  }, []);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const startEdit = (a: Assignment) => {
    setEditingId(a.id);
    setEditForm({
      allocation_rate: String(a.allocation_rate),
      start_date: a.start_date || "",
      end_date: a.end_date || "",
      role: a.role || "",
      is_primary: a.is_primary,
    });
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    await api.patch(`/api/v1/project-assignments/${editingId}`, {
      allocation_rate: Number(editForm.allocation_rate),
      start_date: (editForm.start_date as string) || null,
      end_date: (editForm.end_date as string) || null,
      role: (editForm.role as string) || null,
      is_primary: editForm.is_primary,
    });
    setEditingId(null);
    fetchAssignments();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("このアサインを削除しますか？")) return;
    await api.delete(`/api/v1/project-assignments/${id}`);
    fetchAssignments();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600 }}>アサイン管理</h2>
        <button onClick={() => setShowModal(true)} style={styles.primaryBtn}>新規登録</button>
      </div>

      <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
        <select value={filterProject} onChange={e => setFilterProject(e.target.value)} style={styles.input}>
          <option value="">全プロジェクト</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={filterMember} onChange={e => setFilterMember(e.target.value)} style={styles.input}>
          <option value="">全メンバー</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>プロジェクト</th>
              <th style={styles.th}>メンバー</th>
              <th style={styles.th}>配属率</th>
              <th style={styles.th}>期間</th>
              <th style={styles.th}>役割</th>
              <th style={styles.th}>主担当</th>
              <th style={styles.th}>操作</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map(a => (
              <tr key={a.id}>
                {editingId === a.id ? (
                  <>
                    <td style={styles.td}>{a.project_name}</td>
                    <td style={styles.td}>{a.member_name}</td>
                    <td style={styles.td}>
                      <input type="number" value={editForm.allocation_rate as string} onChange={e => setEditForm({ ...editForm, allocation_rate: e.target.value })} style={{ ...styles.inlineInput, width: 60 }} min={0} max={100} />%
                    </td>
                    <td style={styles.td}>
                      <input type="date" value={editForm.start_date as string} onChange={e => setEditForm({ ...editForm, start_date: e.target.value })} style={styles.inlineInput} />
                      〜
                      <input type="date" value={editForm.end_date as string} onChange={e => setEditForm({ ...editForm, end_date: e.target.value })} style={styles.inlineInput} />
                    </td>
                    <td style={styles.td}>
                      <input value={editForm.role as string} onChange={e => setEditForm({ ...editForm, role: e.target.value })} style={{ ...styles.inlineInput, width: 80 }} />
                    </td>
                    <td style={styles.td}>
                      <input type="checkbox" checked={editForm.is_primary as boolean} onChange={e => setEditForm({ ...editForm, is_primary: e.target.checked })} />
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={handleUpdate} style={styles.smallPrimaryBtn}>保存</button>
                        <button onClick={() => setEditingId(null)} style={styles.smallCancelBtn}>取消</button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={styles.td}>{a.project_name}</td>
                    <td style={styles.td}>{a.member_name}</td>
                    <td style={styles.td}>
                      <span style={{ fontWeight: 600, color: a.allocation_rate > 80 ? "#dc2626" : "#1e293b" }}>
                        {a.allocation_rate}%
                      </span>
                    </td>
                    <td style={styles.td}>{a.start_date || "-"} 〜 {a.end_date || "-"}</td>
                    <td style={styles.td}>{a.role || "-"}</td>
                    <td style={styles.td}>{a.is_primary ? "○" : "-"}</td>
                    <td style={styles.td}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => startEdit(a)} style={styles.smallBtn}>編集</button>
                        <button onClick={() => handleDelete(a.id)} style={styles.smallDangerBtn}>削除</button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {data?.items.length === 0 && (
              <tr>
                <td colSpan={7} style={{ ...styles.td, textAlign: "center", color: "#94a3b8" }}>
                  アサインが登録されていません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <AssignCreateModal
          projects={projects}
          members={members}
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); fetchAssignments(); }}
        />
      )}
    </div>
  );
}

function AssignCreateModal({ projects, members, onClose, onCreated }: {
  projects: { id: string; name: string }[];
  members: { id: string; name: string }[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    project_id: "", member_id: "", allocation_rate: "50",
    start_date: "", end_date: "", role: "", is_primary: false,
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.project_id || !form.member_id) {
      setError("プロジェクトとメンバーを選択してください");
      return;
    }
    try {
      await api.post("/api/v1/project-assignments", {
        project_id: form.project_id,
        member_id: form.member_id,
        allocation_rate: Number(form.allocation_rate),
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        role: form.role || null,
        is_primary: form.is_primary,
      });
      onCreated();
    } catch {
      setError("アサインの登録に失敗しました");
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>アサイン新規登録</h3>
        {error && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={styles.fieldLabel}>
            プロジェクト <span style={{ color: "#dc2626" }}>*</span>
            <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })} style={styles.modalInput} required>
              <option value="">選択してください</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label style={styles.fieldLabel}>
            メンバー <span style={{ color: "#dc2626" }}>*</span>
            <select value={form.member_id} onChange={e => setForm({ ...form, member_id: e.target.value })} style={styles.modalInput} required>
              <option value="">選択してください</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </label>
          <label style={styles.fieldLabel}>
            配属率 (%) <span style={{ color: "#dc2626" }}>*</span>
            <input type="number" min={0} max={100} value={form.allocation_rate} onChange={e => setForm({ ...form, allocation_rate: e.target.value })} style={styles.modalInput} required />
          </label>
          <div style={{ display: "flex", gap: 12 }}>
            <label style={{ ...styles.fieldLabel, flex: 1 }}>
              開始日
              <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} style={styles.modalInput} />
            </label>
            <label style={{ ...styles.fieldLabel, flex: 1 }}>
              終了日
              <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} style={styles.modalInput} />
            </label>
          </div>
          <label style={styles.fieldLabel}>
            役割
            <input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={styles.modalInput} />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 500, color: "#374151" }}>
            <input type="checkbox" checked={form.is_primary} onChange={e => setForm({ ...form, is_primary: e.target.checked })} />
            主担当
          </label>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
            <button type="button" onClick={onClose} style={styles.cancelBtn}>キャンセル</button>
            <button type="submit" style={styles.primaryBtn}>登録</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  primaryBtn: { padding: "8px 16px", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: "pointer" },
  cancelBtn: { padding: "8px 16px", backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 14, cursor: "pointer" },
  input: { padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14 },
  inlineInput: { padding: "4px 6px", border: "1px solid #d1d5db", borderRadius: 4, fontSize: 13 },
  tableWrapper: { backgroundColor: "#fff", borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" },
  table: { width: "100%", borderCollapse: "collapse" as const },
  th: { textAlign: "left" as const, padding: "10px 12px", fontSize: 12, fontWeight: 600, color: "#64748b", borderBottom: "1px solid #e2e8f0", backgroundColor: "#f8fafc" },
  td: { padding: "10px 12px", fontSize: 14, borderBottom: "1px solid #f1f5f9" },
  smallBtn: { padding: "4px 8px", fontSize: 12, border: "1px solid #d1d5db", borderRadius: 4, cursor: "pointer", backgroundColor: "#fff" },
  smallPrimaryBtn: { padding: "4px 8px", fontSize: 12, border: "none", borderRadius: 4, cursor: "pointer", backgroundColor: "#2563eb", color: "#fff" },
  smallCancelBtn: { padding: "4px 8px", fontSize: 12, border: "1px solid #d1d5db", borderRadius: 4, cursor: "pointer", backgroundColor: "#f1f5f9" },
  smallDangerBtn: { padding: "4px 8px", fontSize: 12, border: "1px solid #fca5a5", borderRadius: 4, cursor: "pointer", backgroundColor: "#fff", color: "#dc2626" },
  overlay: { position: "fixed" as const, inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 },
  modal: { backgroundColor: "#fff", borderRadius: 8, padding: 32, width: 520, maxHeight: "90vh", overflowY: "auto" as const },
  fieldLabel: { display: "flex", flexDirection: "column" as const, gap: 4, fontSize: 13, fontWeight: 500, color: "#374151" },
  modalInput: { padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14 },
};
