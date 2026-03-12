"use client";

import { useAuth } from "@/lib/auth";

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header style={styles.header}>
      <div style={styles.breadcrumb}></div>
      <div style={styles.userArea}>
        <span style={styles.userName}>{user?.name || ""}</span>
        <button style={styles.logoutBtn} onClick={logout}>
          ログアウト
        </button>
      </div>
    </header>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    height: 56,
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
  },
  breadcrumb: {},
  userArea: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  userName: {
    fontSize: 14,
    color: "#64748b",
  },
  logoutBtn: {
    padding: "6px 12px",
    fontSize: 13,
    backgroundColor: "transparent",
    border: "1px solid #e2e8f0",
    borderRadius: 4,
    cursor: "pointer",
    color: "#64748b",
  },
};
