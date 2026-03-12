"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface Task {
  id: string;
  project_id: string;
  assignee_member_id: string | null;
  created_by_user_id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  project_name: string | null;
  assignee_name: string | null;
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

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [members, setMembers] = useState<SelectOption[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const [t, mRes] = await Promise.all([
        api.get<Task>(`/api/v1/tasks/${params.id}`),
        api.get<{ items: SelectOption[] }>("/api/v1/members?limit=100"),
      ]);
      setTask(t);
      setMembers(mRes.items);
    };
    fetchData();
  }, [params.id]);

  const startEdit = () => {
    if (!task) return;
    setForm({
      title: task.title,
      description: task.description || "",
      assignee_member_id: task.assignee_member_id || "",
      status: task.status,
      priority: task.priority,
      due_date: task.due_date || "",
      estimated_hours: task.estimated_hours?.toString() || "",
      actual_hours: task.actual_hours?.toString() || "",
    });
    setEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.patch<Task>(`/api/v1/tasks/${params.id}`, {
        title: form.title,
        description: form.description || null,
        assignee_member_id: form.assignee_member_id || null,
        status: form.status,
        priority: form.priority,
        due_date: form.due_date || null,
        estimated_hours: form.estimated_hours ? Number(form.estimated_hours) : null,
        actual_hours: form.actual_hours ? Number(form.actual_hours) : null,
      });
      setTask(res);
      setEditing(false);
    } catch {
      setError("更新に失敗しました");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    const res = await api.patch<Task>(`/api/v1/tasks/${params.id}/status`, { status: newStatus });
    setTask(res);
  };

  const handleDelete = async () => {
    if (!confirm("このタスクを削除しますか？")) return;
    await api.delete(`/api/v1/tasks/${params.id}`);
    router.push("/tasks");
  };

  if (!task) return <p style={{ color: "#64748b" }}>Loading...</p>;

  const sc = statusColors[task.status] || { bg: "#f1f5f9", color: "#475569" };
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "done" && task.status !== "cancelled";

  return (
    <div>
      <button onClick={() => router.push("/tasks")} style={styles.backBtn}>← タスク一覧に戻る</button>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600 }}>タスク詳細</h2>
        <div style={{ display: "flex", gap: 8 }}>
          {!editing && (
            <>
              <button onClick={startEdit} style={styles.primaryBtn}>編集</button>
              <button onClick={handleDelete} style={styles.dangerBtn}>削除</button>
            </>
          )}
        </div>
      </div>

      {/* Quick status change */}
      {!editing && (
        <div style={{ marginBottom: 16, display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "#64748b", marginRight: 4 }}>ステータス変更:</span>
          {["todo", "in_progress", "review", "done"].map(s => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              disabled={task.status === s}
              style={{
                padding: "4px 10px", fontSize: 12, borderRadius: 4, cursor: "pointer", border: "1px solid #e2e8f0",
                backgroundColor: task.status === s ? statusColors[s]?.bg : "#fff",
                color: task.status === s ? statusColors[s]?.color : "#64748b",
                fontWeight: task.status === s ? 600 : 400,
              }}
            >
              {statusLabels[s]}
            </button>
          ))}
        </div>
      )}

      <div style={styles.card}>
        {editing ? (
          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {error && <p style={{ color: "#dc2626", fontSize: 13 }}>{error}</p>}
            <Field label="件名" value={form.title} onChange={v => setForm({ ...form, title: v })} required />
            <label style={styles.fieldLabel}>
              説明
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...styles.input, minHeight: 80 }} />
            </label>
            <label style={styles.fieldLabel}>
              担当者
              <select value={form.assignee_member_id} onChange={e => setForm({ ...form, assignee_member_id: e.target.value })} style={styles.input}>
                <option value="">未割当</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </label>
            <div style={{ display: "flex", gap: 12 }}>
              <label style={{ ...styles.fieldLabel, flex: 1 }}>
                ステータス
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={styles.input}>
                  <option value="todo">未着手</option>
                  <option value="in_progress">進行中</option>
                  <option value="review">レビュー</option>
                  <option value="done">完了</option>
                  <option value="cancelled">中止</option>
                </select>
              </label>
              <label style={{ ...styles.fieldLabel, flex: 1 }}>
                優先度
                <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} style={styles.input}>
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                  <option value="critical">緊急</option>
                </select>
              </label>
            </div>
            <Field label="期限" value={form.due_date} onChange={v => setForm({ ...form, due_date: v })} type="date" />
            <div style={{ display: "flex", gap: 12 }}>
              <Field label="見積工数(時間)" value={form.estimated_hours} onChange={v => setForm({ ...form, estimated_hours: v })} type="number" />
              <Field label="実績工数(時間)" value={form.actual_hours} onChange={v => setForm({ ...form, actual_hours: v })} type="number" />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button type="submit" style={styles.primaryBtn}>保存</button>
              <button type="button" onClick={() => setEditing(false)} style={styles.cancelBtn}>キャンセル</button>
            </div>
          </form>
        ) : (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <span style={{ padding: "4px 12px", borderRadius: 4, fontSize: 13, fontWeight: 600, backgroundColor: sc.bg, color: sc.color }}>
                {statusLabels[task.status] || task.status}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: { low: "#64748b", medium: "#2563eb", high: "#ea580c", critical: "#dc2626" }[task.priority] || "#64748b" }}>
                優先度: {priorityLabels[task.priority] || task.priority}
              </span>
            </div>
            <dl style={styles.dl}>
              <InfoRow label="件名" value={task.title} />
              <InfoRow label="プロジェクト" value={task.project_name || "-"} />
              <InfoRow label="担当者" value={task.assignee_name || "未割当"} />
              <InfoRow label="説明" value={task.description || "-"} />
              <InfoRow label="期限" value={task.due_date || "-"} highlight={!!isOverdue} />
              <InfoRow label="見積工数" value={task.estimated_hours != null ? `${task.estimated_hours}h` : "-"} />
              <InfoRow label="実績工数" value={task.actual_hours != null ? `${task.actual_hours}h` : "-"} />
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: "flex", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
      <dt style={{ width: 160, fontSize: 13, color: "#64748b", fontWeight: 500 }}>{label}</dt>
      <dd style={{ fontSize: 14, whiteSpace: "pre-wrap", color: highlight ? "#dc2626" : undefined, fontWeight: highlight ? 600 : undefined }}>{value}</dd>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required = false }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean;
}) {
  return (
    <label style={{ ...styles.fieldLabel, flex: 1 }}>
      {label} {required && <span style={{ color: "#dc2626" }}>*</span>}
      <input type={type} step={type === "number" ? "0.5" : undefined} value={value} onChange={e => onChange(e.target.value)} style={styles.input} required={required} />
    </label>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: { backgroundColor: "#fff", borderRadius: 8, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" },
  dl: { display: "flex", flexDirection: "column" as const },
  primaryBtn: { padding: "8px 16px", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: "pointer" },
  dangerBtn: { padding: "8px 16px", backgroundColor: "#fff", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: 6, fontSize: 14, cursor: "pointer" },
  cancelBtn: { padding: "8px 16px", backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 14, cursor: "pointer" },
  fieldLabel: { display: "flex", flexDirection: "column" as const, gap: 4, fontSize: 13, fontWeight: 500, color: "#374151" },
  input: { padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14 },
  backBtn: { background: "none", border: "none", color: "#2563eb", fontSize: 14, cursor: "pointer", padding: 0, marginBottom: 12 },
};
