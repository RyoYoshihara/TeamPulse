"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface Member {
  id: string;
  name: string;
  employee_code: string | null;
  department: string | null;
  position: string | null;
  monthly_capacity_hours: number | null;
  employment_type: string | null;
  is_active: boolean;
  joined_at: string | null;
}

export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMember = async () => {
      const res = await api.get<Member>(`/api/v1/members/${params.id}`);
      setMember(res);
    };
    fetchMember();
  }, [params.id]);

  const startEdit = () => {
    if (!member) return;
    setForm({
      name: member.name,
      employee_code: member.employee_code || "",
      department: member.department || "",
      position: member.position || "",
      monthly_capacity_hours: member.monthly_capacity_hours?.toString() || "",
      employment_type: member.employment_type || "full_time",
    });
    setEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.patch<Member>(`/api/v1/members/${params.id}`, {
        ...form,
        monthly_capacity_hours: form.monthly_capacity_hours ? Number(form.monthly_capacity_hours) : null,
        employee_code: form.employee_code || null,
        department: form.department || null,
        position: form.position || null,
      });
      setMember(res);
      setEditing(false);
    } catch {
      setError("更新に失敗しました");
    }
  };

  const handleDelete = async () => {
    if (!confirm("このメンバーを削除しますか？")) return;
    await api.delete(`/api/v1/members/${params.id}`);
    router.push("/members");
  };

  if (!member) {
    return <p style={{ color: "#64748b" }}>Loading...</p>;
  }

  const employmentLabels: Record<string, string> = {
    full_time: "正社員", contract: "契約社員", part_time: "パート", outsource: "業務委託",
  };

  return (
    <div>
      <button onClick={() => router.push("/members")} style={styles.backBtn}>← メンバー一覧に戻る</button>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600 }}>メンバー詳細</h2>
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
            <Field label="氏名" value={form.name} onChange={v => setForm({ ...form, name: v })} required />
            <Field label="社員番号" value={form.employee_code} onChange={v => setForm({ ...form, employee_code: v })} />
            <Field label="部署" value={form.department} onChange={v => setForm({ ...form, department: v })} />
            <Field label="役職" value={form.position} onChange={v => setForm({ ...form, position: v })} />
            <Field label="月次稼働上限(時間)" value={form.monthly_capacity_hours} onChange={v => setForm({ ...form, monthly_capacity_hours: v })} type="number" />
            <label style={styles.fieldLabel}>
              雇用区分
              <select value={form.employment_type} onChange={e => setForm({ ...form, employment_type: e.target.value })} style={styles.input}>
                <option value="full_time">正社員</option>
                <option value="contract">契約社員</option>
                <option value="part_time">パート</option>
                <option value="outsource">業務委託</option>
              </select>
            </label>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button type="submit" style={styles.primaryBtn}>保存</button>
              <button type="button" onClick={() => setEditing(false)} style={styles.cancelBtn}>キャンセル</button>
            </div>
          </form>
        ) : (
          <dl style={styles.dl}>
            <InfoRow label="氏名" value={member.name} />
            <InfoRow label="社員番号" value={member.employee_code || "-"} />
            <InfoRow label="部署" value={member.department || "-"} />
            <InfoRow label="役職" value={member.position || "-"} />
            <InfoRow label="月次稼働上限" value={member.monthly_capacity_hours ? `${member.monthly_capacity_hours}h` : "-"} />
            <InfoRow label="雇用区分" value={employmentLabels[member.employment_type || ""] || "-"} />
            <InfoRow label="状態" value={member.is_active ? "有効" : "無効"} />
            <InfoRow label="入社日" value={member.joined_at || "-"} />
          </dl>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
      <dt style={{ width: 160, fontSize: 13, color: "#64748b", fontWeight: 500 }}>{label}</dt>
      <dd style={{ fontSize: 14 }}>{value}</dd>
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
