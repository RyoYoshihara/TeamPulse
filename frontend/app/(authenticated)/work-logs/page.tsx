"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";

interface WorkLog {
  id: string;
  task_id: string;
  member_id: string;
  work_date: string;
  worked_hours: number;
  memo: string | null;
  task_title: string | null;
  member_name: string | null;
  project_name: string | null;
}

interface WorkLogListResponse {
  items: WorkLog[];
  total: number;
}

interface SelectOption { id: string; name: string; }
interface TaskOption { id: string; title: string; }

export default function WorkLogsPage() {
  const [data, setData] = useState<WorkLogListResponse | null>(null);
  const [projects, setProjects] = useState<SelectOption[]>([]);
  const [members, setMembers] = useState<SelectOption[]>([]);
  const [tasks, setTasks] = useState<TaskOption[]>([]);
  const [filterProject, setFilterProject] = useState("");
  const [filterMember, setFilterMember] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});

  const fetchWorkLogs = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterProject) params.set("project_id", filterProject);
    if (filterMember) params.set("member_id", filterMember);
    if (dateFrom) params.set("work_date_from", dateFrom);
    if (dateTo) params.set("work_date_to", dateTo);
    const qs = params.toString();
    const res = await api.get<WorkLogListResponse>(`/api/v1/work-logs${qs ? `?${qs}` : ""}`);
    setData(res);
  }, [filterProject, filterMember, dateFrom, dateTo]);

  useEffect(() => {
    Promise.all([
      api.get<{ items: SelectOption[] }>("/api/v1/projects?limit=100"),
      api.get<{ items: SelectOption[] }>("/api/v1/members?limit=100"),
      api.get<{ items: TaskOption[] }>("/api/v1/tasks?limit=100"),
    ]).then(([pRes, mRes, tRes]) => {
      setProjects(pRes.items);
      setMembers(mRes.items);
      setTasks(tRes.items.map(t => ({ id: t.id, title: (t as unknown as { title: string }).title })));
    });
  }, []);

  useEffect(() => { fetchWorkLogs(); }, [fetchWorkLogs]);

  const totalHours = data?.items.reduce((sum, wl) => sum + wl.worked_hours, 0) || 0;

  const startEdit = (wl: WorkLog) => {
    setEditingId(wl.id);
    setEditForm({ work_date: wl.work_date, worked_hours: String(wl.worked_hours), memo: wl.memo || "" });
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    await api.patch(`/api/v1/work-logs/${editingId}`, {
      work_date: editForm.work_date,
      worked_hours: Number(editForm.worked_hours),
      memo: editForm.memo || null,
    });
    setEditingId(null);
    fetchWorkLogs();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この工数ログを削除しますか？")) return;
    await api.delete(`/api/v1/work-logs/${id}`);
    fetchWorkLogs();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600 }}>工数ログ一覧</h2>
        <button onClick={() => setShowModal(true)} style={styles.primaryBtn}>工数登録</button>
      </div>

      <div style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <select value={filterProject} onChange={e => setFilterProject(e.target.value)} style={styles.input}>
          <option value="">全プロジェクト</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={filterMember} onChange={e => setFilterMember(e.target.value)} style={styles.input}>
          <option value="">全メンバー</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={styles.input} placeholder="From" />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={styles.input} placeholder="To" />
      </div>

      {data && data.items.length > 0 && (
        <div style={{ marginBottom: 12, padding: "8px 12px", backgroundColor: "#eff6ff", borderRadius: 6, fontSize: 13, color: "#1e40af" }}>
          合計: <strong>{totalHours.toFixed(1)}h</strong>（{data.total}件）
        </div>
      )}

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>作業日</th>
              <th style={styles.th}>メンバー</th>
              <th style={styles.th}>プロジェクト</th>
              <th style={styles.th}>タスク</th>
              <th style={styles.th}>作業時間</th>
              <th style={styles.th}>メモ</th>
              <th style={styles.th}>操作</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map(wl => (
              <tr key={wl.id}>
                {editingId === wl.id ? (
                  <>
                    <td style={styles.td}><input type="date" value={editForm.work_date} onChange={e => setEditForm({ ...editForm, work_date: e.target.value })} style={styles.inlineInput} /></td>
                    <td style={styles.td}>{wl.member_name}</td>
                    <td style={styles.td}>{wl.project_name}</td>
                    <td style={styles.td}>{wl.task_title}</td>
                    <td style={styles.td}><input type="number" step="0.5" value={editForm.worked_hours} onChange={e => setEditForm({ ...editForm, worked_hours: e.target.value })} style={{ ...styles.inlineInput, width: 60 }} />h</td>
                    <td style={styles.td}><input value={editForm.memo} onChange={e => setEditForm({ ...editForm, memo: e.target.value })} style={{ ...styles.inlineInput, width: 120 }} /></td>
                    <td style={styles.td}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={handleUpdate} style={styles.smallPrimaryBtn}>保存</button>
                        <button onClick={() => setEditingId(null)} style={styles.smallCancelBtn}>取消</button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={styles.td}>{wl.work_date}</td>
                    <td style={styles.td}>{wl.member_name}</td>
                    <td style={styles.td}>{wl.project_name || "-"}</td>
                    <td style={styles.td}>{wl.task_title || "-"}</td>
                    <td style={styles.td}><strong>{wl.worked_hours}h</strong></td>
                    <td style={{ ...styles.td, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{wl.memo || "-"}</td>
                    <td style={styles.td}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => startEdit(wl)} style={styles.smallBtn}>編集</button>
                        <button onClick={() => handleDelete(wl.id)} style={styles.smallDangerBtn}>削除</button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {data?.items.length === 0 && (
              <tr>
                <td colSpan={7} style={{ ...styles.td, textAlign: "center", color: "#94a3b8" }}>
                  工数ログが登録されていません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <WorkLogCreateModal
          tasks={tasks}
          members={members}
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); fetchWorkLogs(); }}
        />
      )}
    </div>
  );
}

function WorkLogCreateModal({ tasks, members, onClose, onCreated }: {
  tasks: TaskOption[]; members: SelectOption[]; onClose: () => void; onCreated: () => void;
}) {
  const [form, setForm] = useState({
    task_id: "", member_id: "", work_date: new Date().toISOString().slice(0, 10),
    worked_hours: "", memo: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.task_id || !form.member_id) { setError("タスクとメンバーを選択してください"); return; }
    try {
      await api.post("/api/v1/work-logs", {
        task_id: form.task_id,
        member_id: form.member_id,
        work_date: form.work_date,
        worked_hours: Number(form.worked_hours),
        memo: form.memo || null,
      });
      onCreated();
    } catch {
      setError("工数ログの登録に失敗しました");
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>工数ログ登録</h3>
        {error && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={styles.fieldLabel}>
            タスク <span style={{ color: "#dc2626" }}>*</span>
            <select value={form.task_id} onChange={e => setForm({ ...form, task_id: e.target.value })} style={styles.modalInput} required>
              <option value="">選択してください</option>
              {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </label>
          <label style={styles.fieldLabel}>
            メンバー <span style={{ color: "#dc2626" }}>*</span>
            <select value={form.member_id} onChange={e => setForm({ ...form, member_id: e.target.value })} style={styles.modalInput} required>
              <option value="">選択してください</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </label>
          <div style={{ display: "flex", gap: 12 }}>
            <label style={{ ...styles.fieldLabel, flex: 1 }}>
              作業日 <span style={{ color: "#dc2626" }}>*</span>
              <input type="date" value={form.work_date} onChange={e => setForm({ ...form, work_date: e.target.value })} style={styles.modalInput} required />
            </label>
            <label style={{ ...styles.fieldLabel, flex: 1 }}>
              作業時間 (h) <span style={{ color: "#dc2626" }}>*</span>
              <input type="number" step="0.5" min="0.5" value={form.worked_hours} onChange={e => setForm({ ...form, worked_hours: e.target.value })} style={styles.modalInput} required />
            </label>
          </div>
          <label style={styles.fieldLabel}>
            メモ
            <textarea value={form.memo} onChange={e => setForm({ ...form, memo: e.target.value })} style={{ ...styles.modalInput, minHeight: 60 }} />
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
