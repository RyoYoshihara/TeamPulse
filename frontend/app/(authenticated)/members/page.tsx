"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface AccountInfo {
  email: string;
  role: string;
}

interface Member {
  id: string;
  name: string;
  department: string | null;
  position: string | null;
  monthly_capacity_hours: number | null;
  employment_type: string | null;
  is_active: boolean;
  employee_code: string | null;
  account: AccountInfo | null;
}

interface MemberListResponse {
  items: Member[];
  total: number;
  page: number;
  limit: number;
}

export default function MembersPage() {
  const [data, setData] = useState<MemberListResponse | null>(null);
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);

  const fetchMembers = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (keyword) params.set("keyword", keyword);
    const res = await api.get<MemberListResponse>(
      `/api/v1/members?${params.toString()}`
    );
    setData(res);
  }, [page, keyword]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchMembers();
  };

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600 }}>メンバー一覧</h2>
        <button onClick={() => setShowModal(true)} style={styles.primaryBtn}>
          新規登録
        </button>
      </div>

      <form onSubmit={handleSearch} style={{ marginBottom: 16, display: "flex", gap: 8 }}>
        <input
          type="text"
          placeholder="名前で検索"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={styles.input}
        />
        <button type="submit" style={styles.searchBtn}>検索</button>
      </form>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>社員番号</th>
              <th style={styles.th}>氏名</th>
              <th style={styles.th}>部署</th>
              <th style={styles.th}>役職</th>
              <th style={styles.th}>月次稼働上限</th>
              <th style={styles.th}>雇用区分</th>
              <th style={styles.th}>アカウント</th>
              <th style={styles.th}>状態</th>
              <th style={styles.th}>操作</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((m) => (
              <tr key={m.id}>
                <td style={styles.td}>{m.employee_code || "-"}</td>
                <td style={styles.td}>{m.name}</td>
                <td style={styles.td}>{m.department || "-"}</td>
                <td style={styles.td}>{m.position || "-"}</td>
                <td style={styles.td}>{m.monthly_capacity_hours ? `${m.monthly_capacity_hours}h` : "-"}</td>
                <td style={styles.td}>{m.employment_type || "-"}</td>
                <td style={styles.td}>
                  {m.account ? (
                    <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 12, backgroundColor: "#dbeafe", color: "#1e40af" }}>
                      {m.account.role}
                    </span>
                  ) : (
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>-</span>
                  )}
                </td>
                <td style={styles.td}>
                  <span style={{
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: 12,
                    backgroundColor: m.is_active ? "#dcfce7" : "#fee2e2",
                    color: m.is_active ? "#166534" : "#991b1b",
                  }}>
                    {m.is_active ? "有効" : "無効"}
                  </span>
                </td>
                <td style={styles.td}>
                  <Link href={`/members/${m.id}`} style={styles.link}>詳細</Link>
                </td>
              </tr>
            ))}
            {data?.items.length === 0 && (
              <tr>
                <td colSpan={9} style={{ ...styles.td, textAlign: "center", color: "#94a3b8" }}>
                  メンバーが登録されていません
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
        <MemberCreateModal
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); fetchMembers(); }}
        />
      )}
    </div>
  );
}

function MemberCreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: "", employee_code: "", department: "", position: "",
    monthly_capacity_hours: "", employment_type: "full_time",
  });
  const [createAccount, setCreateAccount] = useState(false);
  const [accountForm, setAccountForm] = useState({ email: "", password: "", role: "member" });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const body: Record<string, unknown> = {
        ...form,
        monthly_capacity_hours: form.monthly_capacity_hours ? Number(form.monthly_capacity_hours) : null,
        employee_code: form.employee_code || null,
        department: form.department || null,
        position: form.position || null,
      };
      if (createAccount && accountForm.email && accountForm.password) {
        body.account = { email: accountForm.email, password: accountForm.password, role: accountForm.role };
      }
      await api.post("/api/v1/members", body);
      onCreated();
    } catch {
      setError("メンバーの作成に失敗しました");
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>メンバー新規登録</h3>
        {error && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={styles.fieldLabel}>
            氏名 <span style={{ color: "#dc2626" }}>*</span>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={styles.modalInput} required />
          </label>
          <label style={styles.fieldLabel}>
            社員番号
            <input value={form.employee_code} onChange={e => setForm({ ...form, employee_code: e.target.value })} style={styles.modalInput} />
          </label>
          <label style={styles.fieldLabel}>
            部署
            <input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} style={styles.modalInput} />
          </label>
          <label style={styles.fieldLabel}>
            役職
            <input value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} style={styles.modalInput} />
          </label>
          <label style={styles.fieldLabel}>
            月次稼働上限(時間)
            <input type="number" value={form.monthly_capacity_hours} onChange={e => setForm({ ...form, monthly_capacity_hours: e.target.value })} style={styles.modalInput} />
          </label>
          <label style={styles.fieldLabel}>
            雇用区分
            <select value={form.employment_type} onChange={e => setForm({ ...form, employment_type: e.target.value })} style={styles.modalInput}>
              <option value="full_time">正社員</option>
              <option value="contract">契約社員</option>
              <option value="part_time">パート</option>
              <option value="outsource">業務委託</option>
            </select>
          </label>

          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 12, marginTop: 4 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
              <input type="checkbox" checked={createAccount} onChange={e => setCreateAccount(e.target.checked)} />
              ログインアカウントを作成する
            </label>
          </div>

          {createAccount && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 12, backgroundColor: "#f8fafc", borderRadius: 6 }}>
              <label style={styles.fieldLabel}>
                メールアドレス <span style={{ color: "#dc2626" }}>*</span>
                <input type="email" value={accountForm.email} onChange={e => setAccountForm({ ...accountForm, email: e.target.value })} style={styles.modalInput} required />
              </label>
              <label style={styles.fieldLabel}>
                パスワード <span style={{ color: "#dc2626" }}>*</span>
                <input type="password" value={accountForm.password} onChange={e => setAccountForm({ ...accountForm, password: e.target.value })} style={styles.modalInput} required minLength={6} />
              </label>
              <label style={styles.fieldLabel}>
                ロール
                <select value={accountForm.role} onChange={e => setAccountForm({ ...accountForm, role: e.target.value })} style={styles.modalInput}>
                  <option value="member">メンバー</option>
                  <option value="manager">マネージャー</option>
                  <option value="admin">管理者</option>
                </select>
              </label>
            </div>
          )}

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
  searchBtn: { padding: "8px 16px", backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 14, cursor: "pointer" },
  cancelBtn: { padding: "8px 16px", backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 14, cursor: "pointer" },
  input: { padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, width: 240 },
  tableWrapper: { backgroundColor: "#fff", borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" },
  table: { width: "100%", borderCollapse: "collapse" as const },
  th: { textAlign: "left" as const, padding: "10px 12px", fontSize: 12, fontWeight: 600, color: "#64748b", borderBottom: "1px solid #e2e8f0", backgroundColor: "#f8fafc" },
  td: { padding: "10px 12px", fontSize: 14, borderBottom: "1px solid #f1f5f9" },
  link: { color: "#2563eb", fontSize: 13 },
  pageBtn: { padding: "6px 12px", border: "1px solid #e2e8f0", borderRadius: 4, fontSize: 13, cursor: "pointer", backgroundColor: "#fff" },
  overlay: { position: "fixed" as const, inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 },
  modal: { backgroundColor: "#fff", borderRadius: 8, padding: 32, width: 480, maxHeight: "90vh", overflowY: "auto" as const },
  fieldLabel: { display: "flex", flexDirection: "column" as const, gap: 4, fontSize: 13, fontWeight: 500, color: "#374151" },
  modalInput: { padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14 },
};
