"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface Project {
  id: string;
  project_code: string | null;
  name: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  progress_rate: number | null;
  assignment_count: number;
}

interface ProjectListResponse {
  items: Project[];
  total: number;
  page: number;
  limit: number;
}

const statusLabels: Record<string, string> = {
  planning: "計画中",
  active: "進行中",
  on_hold: "保留",
  completed: "完了",
  cancelled: "中止",
};

const statusColors: Record<string, { bg: string; color: string }> = {
  planning: { bg: "#e0e7ff", color: "#3730a3" },
  active: { bg: "#dcfce7", color: "#166534" },
  on_hold: { bg: "#fef9c3", color: "#854d0e" },
  completed: { bg: "#f1f5f9", color: "#475569" },
  cancelled: { bg: "#fee2e2", color: "#991b1b" },
};

export default function ProjectsPage() {
  const [data, setData] = useState<ProjectListResponse | null>(null);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);

  const fetchProjects = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (keyword) params.set("keyword", keyword);
    if (statusFilter) params.set("status", statusFilter);
    const res = await api.get<ProjectListResponse>(
      `/api/v1/projects?${params.toString()}`
    );
    setData(res);
  }, [page, keyword, statusFilter]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProjects();
  };

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600 }}>プロジェクト一覧</h2>
        <button onClick={() => setShowModal(true)} style={styles.primaryBtn}>
          新規作成
        </button>
      </div>

      <form onSubmit={handleSearch} style={{ marginBottom: 16, display: "flex", gap: 8 }}>
        <input
          type="text"
          placeholder="プロジェクト名で検索"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={styles.input}
        />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={styles.input}>
          <option value="">全ステータス</option>
          <option value="planning">計画中</option>
          <option value="active">進行中</option>
          <option value="on_hold">保留</option>
          <option value="completed">完了</option>
          <option value="cancelled">中止</option>
        </select>
        <button type="submit" style={styles.searchBtn}>検索</button>
      </form>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>案件コード</th>
              <th style={styles.th}>プロジェクト名</th>
              <th style={styles.th}>状態</th>
              <th style={styles.th}>開始日</th>
              <th style={styles.th}>終了日</th>
              <th style={styles.th}>進捗率</th>
              <th style={styles.th}>アサイン人数</th>
              <th style={styles.th}>操作</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((p) => {
              const sc = statusColors[p.status] || { bg: "#f1f5f9", color: "#475569" };
              return (
                <tr key={p.id}>
                  <td style={styles.td}>{p.project_code || "-"}</td>
                  <td style={styles.td}>{p.name}</td>
                  <td style={styles.td}>
                    <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 12, backgroundColor: sc.bg, color: sc.color }}>
                      {statusLabels[p.status] || p.status}
                    </span>
                  </td>
                  <td style={styles.td}>{p.start_date || "-"}</td>
                  <td style={styles.td}>{p.end_date || "-"}</td>
                  <td style={styles.td}>
                    {p.progress_rate != null ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 60, height: 6, backgroundColor: "#e2e8f0", borderRadius: 3 }}>
                          <div style={{ width: `${p.progress_rate}%`, height: "100%", backgroundColor: "#2563eb", borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 12, color: "#64748b" }}>{p.progress_rate}%</span>
                      </div>
                    ) : "-"}
                  </td>
                  <td style={styles.td}>{p.assignment_count}名</td>
                  <td style={styles.td}>
                    <Link href={`/projects/${p.id}`} style={styles.link}>詳細</Link>
                  </td>
                </tr>
              );
            })}
            {data?.items.length === 0 && (
              <tr>
                <td colSpan={8} style={{ ...styles.td, textAlign: "center", color: "#94a3b8" }}>
                  プロジェクトが登録されていません
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
        <ProjectCreateModal
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); fetchProjects(); }}
        />
      )}
    </div>
  );
}

function ProjectCreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: "", project_code: "", description: "",
    start_date: "", end_date: "", status: "planning", progress_rate: "0",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/api/v1/projects", {
        name: form.name,
        project_code: form.project_code || null,
        description: form.description || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        status: form.status,
        progress_rate: form.progress_rate ? Number(form.progress_rate) : 0,
      });
      onCreated();
    } catch {
      setError("プロジェクトの作成に失敗しました");
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>プロジェクト新規作成</h3>
        {error && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={styles.fieldLabel}>
            プロジェクト名 <span style={{ color: "#dc2626" }}>*</span>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={styles.modalInput} required />
          </label>
          <label style={styles.fieldLabel}>
            案件コード
            <input value={form.project_code} onChange={e => setForm({ ...form, project_code: e.target.value })} style={styles.modalInput} />
          </label>
          <label style={styles.fieldLabel}>
            説明
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...styles.modalInput, minHeight: 60 }} />
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
            ステータス
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={styles.modalInput}>
              <option value="planning">計画中</option>
              <option value="active">進行中</option>
              <option value="on_hold">保留</option>
              <option value="completed">完了</option>
              <option value="cancelled">中止</option>
            </select>
          </label>
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
  modal: { backgroundColor: "#fff", borderRadius: 8, padding: 32, width: 520, maxHeight: "90vh", overflowY: "auto" as const },
  fieldLabel: { display: "flex", flexDirection: "column" as const, gap: 4, fontSize: 13, fontWeight: 500, color: "#374151" },
  modalInput: { padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14 },
};
