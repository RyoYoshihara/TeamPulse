"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface Project {
  id: string;
  project_code: string | null;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  progress_rate: number | null;
  assignment_count: number;
}

const statusLabels: Record<string, string> = {
  planning: "計画中", active: "進行中", on_hold: "保留", completed: "完了", cancelled: "中止",
};

const statusColors: Record<string, { bg: string; color: string }> = {
  planning: { bg: "#e0e7ff", color: "#3730a3" },
  active: { bg: "#dcfce7", color: "#166534" },
  on_hold: { bg: "#fef9c3", color: "#854d0e" },
  completed: { bg: "#f1f5f9", color: "#475569" },
  cancelled: { bg: "#fee2e2", color: "#991b1b" },
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProject = async () => {
      const res = await api.get<Project>(`/api/v1/projects/${params.id}`);
      setProject(res);
    };
    fetchProject();
  }, [params.id]);

  const startEdit = () => {
    if (!project) return;
    setForm({
      name: project.name,
      project_code: project.project_code || "",
      description: project.description || "",
      start_date: project.start_date || "",
      end_date: project.end_date || "",
      status: project.status,
      progress_rate: project.progress_rate?.toString() || "0",
    });
    setEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.patch<Project>(`/api/v1/projects/${params.id}`, {
        name: form.name,
        project_code: form.project_code || null,
        description: form.description || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        status: form.status,
        progress_rate: form.progress_rate ? Number(form.progress_rate) : 0,
      });
      setProject(res);
      setEditing(false);
    } catch {
      setError("更新に失敗しました");
    }
  };

  const handleDelete = async () => {
    if (!confirm("このプロジェクトを削除しますか？")) return;
    await api.delete(`/api/v1/projects/${params.id}`);
    router.push("/projects");
  };

  if (!project) {
    return <p style={{ color: "#64748b" }}>Loading...</p>;
  }

  const sc = statusColors[project.status] || { bg: "#f1f5f9", color: "#475569" };

  return (
    <div>
      <button onClick={() => router.push("/projects")} style={styles.backBtn}>← プロジェクト一覧に戻る</button>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600 }}>プロジェクト詳細</h2>
        <div style={{ display: "flex", gap: 8 }}>
          {!editing && (
            <>
              <button onClick={startEdit} style={styles.primaryBtn}>編集</button>
              <button onClick={handleDelete} style={styles.dangerBtn}>削除</button>
            </>
          )}
        </div>
      </div>

      <div style={styles.card}>
        {editing ? (
          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {error && <p style={{ color: "#dc2626", fontSize: 13 }}>{error}</p>}
            <Field label="プロジェクト名" value={form.name} onChange={v => setForm({ ...form, name: v })} required />
            <Field label="案件コード" value={form.project_code} onChange={v => setForm({ ...form, project_code: v })} />
            <label style={styles.fieldLabel}>
              説明
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...styles.input, minHeight: 80 }} />
            </label>
            <div style={{ display: "flex", gap: 12 }}>
              <label style={{ ...styles.fieldLabel, flex: 1 }}>
                開始日
                <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} style={styles.input} />
              </label>
              <label style={{ ...styles.fieldLabel, flex: 1 }}>
                終了日
                <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} style={styles.input} />
              </label>
            </div>
            <label style={styles.fieldLabel}>
              ステータス
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={styles.input}>
                <option value="planning">計画中</option>
                <option value="active">進行中</option>
                <option value="on_hold">保留</option>
                <option value="completed">完了</option>
                <option value="cancelled">中止</option>
              </select>
            </label>
            <Field label="進捗率 (%)" value={form.progress_rate} onChange={v => setForm({ ...form, progress_rate: v })} type="number" />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button type="submit" style={styles.primaryBtn}>保存</button>
              <button type="button" onClick={() => setEditing(false)} style={styles.cancelBtn}>キャンセル</button>
            </div>
          </form>
        ) : (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <span style={{ padding: "4px 12px", borderRadius: 4, fontSize: 13, fontWeight: 600, backgroundColor: sc.bg, color: sc.color }}>
                {statusLabels[project.status] || project.status}
              </span>
              {project.progress_rate != null && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 100, height: 8, backgroundColor: "#e2e8f0", borderRadius: 4 }}>
                    <div style={{ width: `${project.progress_rate}%`, height: "100%", backgroundColor: "#2563eb", borderRadius: 4 }} />
                  </div>
                  <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>{project.progress_rate}%</span>
                </div>
              )}
            </div>
            <dl style={styles.dl}>
              <InfoRow label="プロジェクト名" value={project.name} />
              <InfoRow label="案件コード" value={project.project_code || "-"} />
              <InfoRow label="説明" value={project.description || "-"} />
              <InfoRow label="開始日" value={project.start_date || "-"} />
              <InfoRow label="終了日" value={project.end_date || "-"} />
              <InfoRow label="アサイン人数" value={`${project.assignment_count}名`} />
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
      <dt style={{ width: 160, fontSize: 13, color: "#64748b", fontWeight: 500 }}>{label}</dt>
      <dd style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>{value}</dd>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required = false }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean;
}) {
  return (
    <label style={styles.fieldLabel}>
      {label} {required && <span style={{ color: "#dc2626" }}>*</span>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} style={styles.input} required={required} />
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
