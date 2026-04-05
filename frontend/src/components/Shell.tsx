import { useState } from "react";
import type { ReactNode } from "react";
import type { AppUser, NavItem, PageId } from "../types/app";

interface ShellProps {
  user: AppUser;
  nav: NavItem[];
  activePage: PageId;
  onNav: (page: PageId) => void;
  onLogout: () => void;
  children: ReactNode;
}

export default function Shell({
  user,
  nav,
  activePage,
  onNav,
  onLogout,
  children,
}: ShellProps) {
  const accentVar =
    user.role === "chef"
      ? "var(--chef-accent)"
      : user.role === "enseignant"
        ? "var(--ens-accent)"
        : "var(--etu-accent)";
  const dimVar =
    user.role === "chef"
      ? "var(--chef-dim)"
      : user.role === "enseignant"
        ? "var(--ens-dim)"
        : "var(--etu-dim)";
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}
    >
      <aside
        style={{
          width: collapsed ? 68 : 228,
          minHeight: "100vh",
          background: "var(--bg2)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 100,
          transition: "width 0.25s cubic-bezier(0.16,1,0.3,1)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: collapsed ? "20px 16px" : "22px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            justifyContent: collapsed ? "center" : "flex-start",
          }}
        >
          <button
            onClick={() => {
              setCollapsed((state) => !state);
            }}
            style={{
              background: "none",
              border: "none",
              color: accentVar,
              fontSize: 20,
              cursor: "pointer",
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            ◈
          </button>
          {!collapsed && (
            <span
              style={{
                fontWeight: 800,
                fontSize: 16,
                letterSpacing: "-0.5px",
                color: "var(--text)",
                whiteSpace: "nowrap",
              }}
            >
              GestionPFE
            </span>
          )}
        </div>

        {!collapsed && (
          <div style={{ padding: "14px 20px 10px" }}>
            <div
              style={{
                padding: "8px 12px",
                background: dimVar,
                borderRadius: "var(--r-md)",
                border: `1px solid ${accentVar}25`,
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 9,
                  textTransform: "uppercase",
                  letterSpacing: "1.5px",
                  color: accentVar,
                  marginBottom: 3,
                }}
              >
                Connecté en tant que
              </div>
              <div
                style={{ fontWeight: 700, fontSize: 13, color: "var(--text)" }}
              >
                {user.name}
              </div>
            </div>
          </div>
        )}

        <nav
          style={{
            flex: 1,
            padding: collapsed ? "10px 10px" : "10px 12px",
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          {nav.map((item) => {
            const active = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNav(item.id);
                }}
                title={collapsed ? item.label : ""}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: collapsed ? "11px 0" : "10px 12px",
                  justifyContent: collapsed ? "center" : "flex-start",
                  marginBottom: 3,
                  borderRadius: "var(--r-md)",
                  border: "none",
                  background: active ? dimVar : "transparent",
                  color: active ? accentVar : "var(--text2)",
                  fontWeight: active ? 700 : 400,
                  fontSize: 13,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                  borderLeft:
                    active && !collapsed
                      ? `2px solid ${accentVar}`
                      : "2px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                    e.currentTarget.style.color = "var(--text)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--text2)";
                  }
                }}
              >
                <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && item.badge && (
                  <span
                    style={{
                      marginLeft: "auto",
                      background: accentVar,
                      color: "#000",
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "1px 7px",
                      borderRadius: 20,
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div
          style={{
            padding: collapsed ? "12px 10px" : "12px",
            borderTop: "1px solid var(--border)",
          }}
        >
          <button
            onClick={onLogout}
            title={collapsed ? "Déconnexion" : ""}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 12,
              justifyContent: collapsed ? "center" : "flex-start",
              padding: collapsed ? "10px 0" : "10px 12px",
              borderRadius: "var(--r-md)",
              border: "none",
              background: "none",
              color: "var(--text3)",
              cursor: "pointer",
              fontSize: 13,
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--danger)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text3)";
            }}
          >
            <span style={{ fontSize: 16 }}>⊗</span>
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      <div
        style={{
          marginLeft: collapsed ? 68 : 228,
          flex: 1,
          transition: "margin-left 0.25s cubic-bezier(0.16,1,0.3,1)",
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        <header
          style={{
            height: 56,
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            padding: "0 32px",
            gap: 16,
            position: "sticky",
            top: 0,
            zIndex: 50,
            background: "rgba(8,12,18,0.85)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div
            style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--text3)",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              {nav.find((n) => n.id === activePage)?.label || "—"}
            </span>
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--text3)",
              padding: "4px 12px",
              border: "1px solid var(--border)",
              borderRadius: 40,
            }}
          >
            {new Date().toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </div>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: dimVar,
              border: `1px solid ${accentVar}30`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: accentVar,
              fontWeight: 800,
              fontSize: 12,
            }}
          >
            {user.avatar}
          </div>
        </header>

        <main style={{ flex: 1, overflowY: "auto" }}>{children}</main>
      </div>
    </div>
  );
}
