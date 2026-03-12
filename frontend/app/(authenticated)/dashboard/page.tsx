"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface Summary {
  active_projects_count: number;
  open_tasks_count: number;
  delayed_tasks_count: number;
  over_capacity_members_count: number;
}

interface MemberUtilization {
  member_id: string;
  name: string;
  department: string | null;
  current_allocation_rate: number;
  task_count: number;
}

interface ProjectProgress {
  project_id: string;
  name: string;
  status: string;
  progress_rate: number | null;
  assignment_count: number;
}

interface DelayedTask {
  task_id: string;
  title: string;
  assignee_name: string | null;
  due_date: string | null;
  priority: string;
  project_name: string | null;
}

const statusLabels: Record<string, string> = {
  planning: "計画中", active: "進行中", on_hold: "保留",
};
const statusColors: Record<string, { bg: string; color: string }> = {
  planning: { bg: "#e0e7ff", color: "#3730a3" },
  active: { bg: "#dcfce7", color: "#166534" },
  on_hold: { bg: "#fef9c3", color: "#854d0e" },
};
const priorityLabels: Record<string, string> = {
  low: "低", medium: "中", high: "高", critical: "緊急",
};
const priorityColors: Record<string, string> = {
  low: "#64748b", medium: "#2563eb", high: "#ea580c", critical: "#dc2626",
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [utilizations, setUtilizations] = useState<MemberUtilization[]>([]);
  const [projectProgress, setProjectProgress] = useState<ProjectProgress[]>([]);
  const [delayedTasks, setDelayedTasks] = useState<DelayedTask[]>([]);

  useEffect(() => {
    Promise.all([
      api.get<Summary>("/api/v1/dashboard/summary"),
      api.get<MemberUtilization[]>("/api/v1/dashboard/member-utilizations"),
      api.get<ProjectProgress[]>("/api/v1/dashboard/project-progress"),
      api.get<DelayedTask[]>("/api/v1/dashboard/delayed-tasks"),
    ]).then(([s, u, p, d]) => {
      setSummary(s);
      setUtilizations(u);
      setProjectProgress(p);
      setDelayedTasks(d);
    });
  }, []);

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24 }}>ダッシュボード</h2>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        <StatCard label="進行中プロジェクト" value={summary?.active_projects_count ?? 0} color="#2563eb" />
        <StatCard label="未完了タスク" value={summary?.open_tasks_count ?? 0} color="#0891b2" />
        <StatCard label="遅延タスク" value={summary?.delayed_tasks_count ?? 0} color="#dc2626" />
        <StatCard label="過負荷メンバー" value={summary?.over_capacity_members_count ?? 0} color="#ea580c" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
        {/* Member Utilization */}
        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>メンバー稼働率</h3>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>名前</th>
                <th style={styles.th}>部署</th>
                <th style={styles.th}>配属率</th>
                <th style={styles.th}>タスク数</th>
              </tr>
            </thead>
            <tbody>
              {utilizations.map(m => {
                const overCapacity = m.current_allocation_rate > 100;
                return (
                  <tr key={m.member_id}>
                    <td style={styles.td}>
                      <Link href={`/members/${m.member_id}`} style={{ color: "#2563eb", fontSize: 13 }}>{m.name}</Link>
                    </td>
                    <td style={styles.td}>{m.department || "-"}</td>
                    <td style={styles.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 60, height: 6, backgroundColor: "#e2e8f0", borderRadius: 3 }}>
                          <div style={{
                            width: `${Math.min(m.current_allocation_rate, 100)}%`,
                            height: "100%",
                            backgroundColor: overCapacity ? "#dc2626" : m.current_allocation_rate > 80 ? "#ea580c" : "#2563eb",
                            borderRadius: 3,
                          }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: overCapacity ? "#dc2626" : "#64748b" }}>
                          {m.current_allocation_rate}%
                        </span>
                      </div>
                    </td>
                    <td style={styles.td}>{m.task_count}</td>
                  </tr>
                );
              })}
              {utilizations.length === 0 && (
                <tr><td colSpan={4} style={{ ...styles.td, textAlign: "center", color: "#94a3b8" }}>データなし</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Project Progress */}
        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>プロジェクト進捗</h3>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>プロジェクト名</th>
                <th style={styles.th}>状態</th>
                <th style={styles.th}>進捗率</th>
                <th style={styles.th}>人数</th>
              </tr>
            </thead>
            <tbody>
              {projectProgress.map(p => {
                const sc = statusColors[p.status] || { bg: "#f1f5f9", color: "#475569" };
                return (
                  <tr key={p.project_id}>
                    <td style={styles.td}>
                      <Link href={`/projects/${p.project_id}`} style={{ color: "#2563eb", fontSize: 13 }}>{p.name}</Link>
                    </td>
                    <td style={styles.td}>
                      <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, backgroundColor: sc.bg, color: sc.color }}>
                        {statusLabels[p.status] || p.status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {p.progress_rate != null ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 50, height: 6, backgroundColor: "#e2e8f0", borderRadius: 3 }}>
                            <div style={{ width: `${p.progress_rate}%`, height: "100%", backgroundColor: "#2563eb", borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 12, color: "#64748b" }}>{p.progress_rate}%</span>
                        </div>
                      ) : "-"}
                    </td>
                    <td style={styles.td}>{p.assignment_count}名</td>
                  </tr>
                );
              })}
              {projectProgress.length === 0 && (
                <tr><td colSpan={4} style={{ ...styles.td, textAlign: "center", color: "#94a3b8" }}>データなし</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delayed Tasks */}
      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>遅延タスク</h3>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>タスク名</th>
              <th style={styles.th}>プロジェクト</th>
              <th style={styles.th}>担当者</th>
              <th style={styles.th}>期限</th>
              <th style={styles.th}>優先度</th>
            </tr>
          </thead>
          <tbody>
            {delayedTasks.map(t => (
              <tr key={t.task_id}>
                <td style={styles.td}>
                  <Link href={`/tasks/${t.task_id}`} style={{ color: "#2563eb", fontSize: 13 }}>{t.title}</Link>
                </td>
                <td style={styles.td}>{t.project_name || "-"}</td>
                <td style={styles.td}>{t.assignee_name || "-"}</td>
                <td style={{ ...styles.td, color: "#dc2626", fontWeight: 600 }}>{t.due_date}</td>
                <td style={styles.td}>
                  <span style={{ fontWeight: 600, fontSize: 12, color: priorityColors[t.priority] || "#64748b" }}>
                    {priorityLabels[t.priority] || t.priority}
                  </span>
                </td>
              </tr>
            ))}
            {delayedTasks.length === 0 && (
              <tr><td colSpan={5} style={{ ...styles.td, textAlign: "center", color: "#94a3b8" }}>遅延タスクはありません</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ backgroundColor: "#fff", borderRadius: 8, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
      <p style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 700, color }}>{value}</p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: { backgroundColor: "#fff", borderRadius: 8, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" },
  sectionTitle: { fontSize: 15, fontWeight: 600, marginBottom: 12, color: "#1e293b" },
  table: { width: "100%", borderCollapse: "collapse" as const },
  th: { textAlign: "left" as const, padding: "8px 10px", fontSize: 11, fontWeight: 600, color: "#64748b", borderBottom: "1px solid #e2e8f0" },
  td: { padding: "8px 10px", fontSize: 13, borderBottom: "1px solid #f1f5f9" },
};
