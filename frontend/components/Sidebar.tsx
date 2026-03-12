"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { label: "ダッシュボード", href: "/dashboard", icon: "📊" },
  { label: "メンバー管理", href: "/members", icon: "👥" },
  { label: "プロジェクト管理", href: "/projects", icon: "📁" },
  { label: "アサイン管理", href: "/assignments", icon: "🔗" },
  { label: "タスク管理", href: "/tasks", icon: "✅" },
  { label: "工数管理", href: "/work-logs", icon: "⏱" },
  { label: "ユーザー管理", href: "/users", icon: "⚙" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logo}>
        <h1 style={styles.logoText}>ResourceFlow</h1>
      </div>
      <nav style={styles.nav}>
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                ...styles.link,
                ...(isActive ? styles.activeLink : {}),
              }}
            >
              <span style={styles.icon}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 240,
    minHeight: "100vh",
    backgroundColor: "#1e293b",
    color: "#e2e8f0",
    display: "flex",
    flexDirection: "column",
    position: "fixed",
    left: 0,
    top: 0,
  },
  logo: {
    padding: "20px 16px",
    borderBottom: "1px solid #334155",
  },
  logoText: {
    fontSize: 18,
    fontWeight: 700,
    color: "#ffffff",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    padding: "8px 0",
  },
  link: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 16px",
    color: "#cbd5e1",
    fontSize: 14,
    transition: "background 0.2s",
    cursor: "pointer",
  },
  activeLink: {
    backgroundColor: "#334155",
    color: "#ffffff",
    borderLeft: "3px solid #3b82f6",
  },
  icon: {
    fontSize: 16,
  },
};
