"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface Task {
  id: string;
  project_id: string;
  assignee_member_id: string | null;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  project_name: string | null;
  assignee_name: string | null;
}

interface TaskListResponse {
  items: Task[];
  total: number;
  page: number;
  limit: number;
}

interface SelectOption { id: string; name: string; }

const statusLabels: Record<string, string> = {
  todo: "未着手", in_progress: "進行中", review: "レビュー", done: "完了", cancelled: "中止",
};
const statusColors: Record<string, { bg: string; color: string }> = {
  todo: { bg: "#e0e7ff", color: "#3730a3" },
  in_progress: { bg: "#dcfce7", color: "#166534" },
  review: { bg: "#fef9c3", color: "#854d0e" },
  done: { bg: "#f1f5f9", color: "#475569" },
  cancelled: { bg: "#fee2e2", color: "#991b1b" },
};
const priorityLabels: Record<string, string> = {
  low: "低", medium: "中", high: "高", critical: "緊急",
};
const priorityColors: Record<string, string> = {
  low: "#64748b", medium: "#2563eb", high: "#ea580c", critical: "#dc2626",
};

export default function TasksPage() {
  const [data, setData] = useState<TaskListResponse | null>(null);
  const [projects, setProjects] = useState<SelectOption[]>([]);
  const [members, setMembers] = useState<SelectOption[]>([]);
  const [keyword, setKeyword] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);

  const fetchTasks = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (keyword) params.set("keyword", keyword);
    if (filterProject) params.set("project_id", filterProject);
    if (filterStatus) params.set("status", filterStatus);
    if (filterPriority) params.set("priority", filterPriority);
    const res = await api.get<TaskListResponse>(`/api/v1/tasks?${params.toString()}`);
    setData(res);
  }, [page, keyword, filterProject, filterStatus, filterPriority]);

  useEffect(() => {
    Promise.all([
      api.get<{ items: SelectOption[] }>("/api/v1/projects?limit=100"),
      api.get<{ items: SelectOption[] }>("/api/v1/members?limit=100"),
    ]).then(([pRes, mRes]) => {
      setProjects(pRes.items);
      setMembers(mRes.items);
    });
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTasks();
  };

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600 }}>タスク一覧</h2>
        <button onClick={() => setShowModal(true)} style={styles.primaryBtn}>新規作成</button>
      </div>

      <form onSubmit={handleSearch} style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input type="text" placeholder="タイトルで検索" value={keyword} onChange={e => setKeyword(e.target.value)} style={styles.input} />
        <select value={filterProject} onChange={e => { setFilterProject(e.target.value); setPage(1); }} style={styles.input}>
          <option value="">全プロジェクト</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} style={styles.input}>
          <option value="">全ステータス</option>
          <option value="todo">未着手</option>
          <option value="in_progress">進行中</option>
          <option value="review">レビュー</option>
          <option value="done">完了</option>
          <option value="cancelled">中止</option>
        </select>
        <select value={filterPriority} onChange={e => { setFilterPriority(e.target.value); setPage(1); }} style={styles.input}>
          <option value="">全優先度</option>
          <option value="low">低</option>
          <option value="medium">中</option>
          <option value="high">高</option>
          <option value="critical">緊急</option>
        </select>
        <button type="submit" style={styles.searchBtn}>検索</button>
      </form>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>件名</th>
              <th style={styles.th}>案件名</th>
              <th style={styles.th}>担当者</th>
              <th style={styles.th}>状態</th>
              <th style={styles.th}>優先度</th>
              <th style={styles.th}>期限</th>
              <th style={styles.th}>見積工数</th>
              <th style={styles.th}>実績工数</th>
              <th style={styles.th}>操作</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map(t => {
              const sc = statusColors[t.status] || { bg: "#f1f5f9", color: "#475569" };
              const isOverdue = t.due_date && new Date(t.due_date) < new Date() && t.status !== "done" && t.status !== "cancelled";
              return (
                <tr key={t.id}>
                  <td style={styles.td}>{t.title}</td>
                  <td style={styles.td}>{t.project_name || "-"}</td>
                  <td style={styles.td}>{t.assignee_name || "-"}</td>
                  <td style={styles.td}>
                    <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 12, backgroundColor: sc.bg, color: sc.color }}>
                      {statusLabels[t.status] || t.status}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={{ fontWeight: 600, fontSize: 12, color: priorityColors[t.priority] || "#64748b" }}>
                      {priorityLabels[t.priority] || t.priority}
                    </span>
                  </td>
                  <td style={{ ...styles.td, color: isOverdue ? "#dc2626" : undefined, fontWeight: isOverdue ? 600 : undefined }}>
                    {t.due_date || "-"}
                  </td>
                  <td style={styles.td}>{t.estimated_hours != null ? `${t.estimated_hours}h` : "-"}</td>
                  <td style={styles.td}>{t.actual_hours != null ? `${t.actual_hours}h` : "-"}</td>
                  <td style={styles.td}>
                    <Link href={`/tasks/${t.id}`} style={styles.link}>詳細</Link>
                  </td>
                </tr>
              );
            })}
            {data?.items.length === 0 && (
              <tr>
                <td colSpan={9} style={{ ...styles.td, textAlign: "center", color: "#94a3b8" }}>
                  タスクが登録されていません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "center" }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={styles.pageBtn}>前へ</button>
          <span style={{ padding: "6px 12px", fontSize: 14, color: "#64748b" }}>{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={styles.pageBtn}>次へ</button>
        </div>
      )}

      {showModal && (
        <TaskCreateModal
          projects={projects}
          members={members}
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); fetchTasks(); }}
        />
      )}
    </div>
  );
}

function TaskCreateModal({ projects, members, onClose, onCreated }: {
  projects: SelectOption[]; members: SelectOption[]; onClose: () => void; onCreated: () => void;
}) {
  const [form, setForm] = useState({
    project_id: "", assignee_member_id: "", title: "", description: "",
    status: "todo", priority: "medium", due_date: "", estimated_hours: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.project_id) { setError("プロジェクトを選択してください"); return; }
    try {
      await api.post("/api/v1/tasks", {
        project_id: form.project_id,
        assignee_member_id: form.assignee_member_id || null,
        title: form.title,
        description: form.description || null,
        status: form.status,
        priority: form.priority,
        due_date: form.due_date || null,
        estimated_hours: form.estimated_hours ? Number(form.estimated_hours) : null,
      });
      onCreated();
    } catch {
      setError("タスクの作成に失敗しました");
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>タスク新規作成</h3>
        {error && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={styles.fieldLabel}>
            件名 <span style={{ color: "#dc2626" }}>*</span>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={styles.modalInput} required />
          </label>
          <label style={styles.fieldLabel}>
            プロジェクト <span style={{ color: "#dc2626" }}>*</span>
            <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })} style={styles.modalInput} required>
              <option value="">選択してください</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label style={styles.fieldLabel}>
            担当者
            <select value={form.assignee_member_id} onChange={e => setForm({ ...form, assignee_member_id: e.target.value })} style={styles.modalInput}>
              <option value="">未割当</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </label>
          <label style={styles.fieldLabel}>
            説明
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...styles.modalInput, minHeight: 60 }} />
          </label>
          <div style={{ display: "flex", gap: 12 }}>
            <label style={{ ...styles.fieldLabel, flex: 1 }}>
              ステータス
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={styles.modalInput}>
                <option value="todo">未着手</option>
                <option value="in_progress">進行中</option>
                <option value="review">レビュー</option>
                <option value="done">完了</option>
              </select>
            </label>
            <label style={{ ...styles.fieldLabel, flex: 1 }}>
              優先度
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} style={styles.modalInput}>
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
                <option value="critical">緊急</option>
              </select>
            </label>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <label style={{ ...styles.fieldLabel, flex: 1 }}>
              期限
              <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} style={styles.modalInput} />
            </label>
            <label style={{ ...styles.fieldLabel, flex: 1 }}>
              見積工数(時間)
              <input type="number" step="0.5" value={form.estimated_hours} onChange={e => setForm({ ...form, estimated_hours: e.target.value })} style={styles.modalInput} />
            </label>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
            <button type="button" onClick={onClose} style={styles.cancelBtn}>キャンセル</button>
            <button type="submit" style={styles.primaryBtn}>作成</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  primaryBtn: { padding: "8px 16px", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: "pointer" },
  searchBtn: { padding: "8px 16px", backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 14, cursor: "pointer" },
  cancelBtn: { padding: "8px 16px", backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 14, cursor: "pointer" },
  input: { padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14 },
  tableWrapper: { backgroundColor: "#fff", borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" },
  table: { width: "100%", borderCollapse: "collapse" as const },
  th: { textAlign: "left" as const, padding: "10px 12px", fontSize: 12, fontWeight: 600, color: "#64748b", borderBottom: "1px solid #e2e8f0", backgroundColor: "#f8fafc" },
  td: { padding: "10px 12px", fontSize: 14, borderBottom: "1px solid #f1f5f9" },
  link: { color: "#2563eb", fontSize: 13 },
  pageBtn: { padding: "6px 12px", border: "1px solid #e2e8f0", borderRadius: 4, fontSize: 13, cursor: "pointer", backgroundColor: "#fff" },
  overlay: { position: "fixed" as const, inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 },
  modal: { backgroundColor: "#fff", borderRadius: 8, padding: 32, width: 560, maxHeight: "90vh", overflowY: "auto" as const },
  fieldLabel: { display: "flex", flexDirection: "column" as const, gap: 4, fontSize: 13, fontWeight: 500, color: "#374151" },
  modalInput: { padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14 },
};
