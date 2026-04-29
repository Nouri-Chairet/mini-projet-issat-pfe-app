import { useState } from "react";
import type { ReactNode } from "react";
import type { AppUser, NavItem, PageId } from "../types/app";
import Icon from "./Icon";
import ProfileAvatar from "./ProfileAvatar";

interface ShellProps {
  user: AppUser;
  nav: NavItem[];
  activePage: PageId;
  onNav: (page: PageId) => void;
  onLogout: () => void;
  children: ReactNode;
}

const ROLE_META: Record<
  AppUser["role"],
  { label: string; accent: string; dim: string; glow: string }
> = {
  chef: {
    label: "Admin",
    accent: "var(--chef-accent)",
    dim: "var(--chef-dim)",
    glow: "var(--chef-glow)",
  },
  enseignant: {
    label: "Enseignant",
    accent: "var(--ens-accent)",
    dim: "var(--ens-dim)",
    glow: "var(--ens-glow)",
  },
  etudiant: {
    label: "Étudiant",
    accent: "var(--etu-accent)",
    dim: "var(--etu-dim)",
    glow: "var(--etu-glow)",
  },
};

export default function Shell({
  user,
  nav,
  activePage,
  onNav,
  onLogout,
  children,
}: ShellProps) {
  const meta = ROLE_META[user.role];
  const [collapsed, setCollapsed] = useState(false);

  const SIDEBAR_W = collapsed ? 76 : 252;

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "transparent",
        color: "var(--text)",
        position: "relative",
      }}
    >
      {/* Animated aurora background */}
      <div className="aurora-layer" aria-hidden>
        <span className="aurora-blob b1" />
        <span className="aurora-blob b2" />
        <span className="aurora-blob b3" />
      </div>

      {/* ============================ SIDEBAR ============================ */}
      <aside
        style={{
          width: SIDEBAR_W,
          minHeight: "100vh",
          background:
            "linear-gradient(180deg, rgba(245,245,220,0.04), rgba(245,245,220,0.01)), rgba(7, 24, 24, 0.72)",
          backdropFilter: "blur(18px) saturate(1.4)",
          WebkitBackdropFilter: "blur(18px) saturate(1.4)",
          borderRight: "1px solid var(--border2)",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 100,
          transition: "width 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
          overflow: "hidden",
        }}
      >
        {/* Logo block */}
        <div
          style={{
            padding: collapsed ? "20px 12px" : "22px 22px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            justifyContent: collapsed ? "center" : "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 11,
              minWidth: 0,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background:
                  "linear-gradient(135deg, var(--gold) 0%, var(--gold-deep) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--bg)",
                boxShadow:
                  "0 0 0 1px rgba(212,175,55,0.3), 0 6px 16px -6px rgba(212,175,55,0.5)",
                flexShrink: 0,
              }}
            >
              <Icon name="graduation" size={18} strokeWidth={2.2} />
            </div>
            {!collapsed && (
              <div style={{ minWidth: 0, lineHeight: 1.1 }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 15,
                    letterSpacing: "-0.02em",
                    color: "var(--text)",
                    whiteSpace: "nowrap",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  GestionPFE
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: "1.5px",
                    color: "var(--gold)",
                    marginTop: 3,
                  }}
                >
                  v1.0 · ISSAT
                </div>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              aria-label="Réduire le menu"
              style={{
                background: "transparent",
                border: "1px solid var(--border)",
                borderRadius: 8,
                width: 28,
                height: 28,
                color: "var(--text3)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--gold)";
                e.currentTarget.style.borderColor = "var(--gold)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text3)";
                e.currentTarget.style.borderColor = "var(--border)";
              }}
            >
              <Icon name="chevron-left" size={14} />
            </button>
          )}
          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              aria-label="Étendre le menu"
              style={{
                position: "absolute",
                bottom: 16,
                left: "50%",
                transform: "translateX(-50%)",
                background: "var(--surface)",
                border: "1px solid var(--border2)",
                borderRadius: 8,
                width: 28,
                height: 28,
                color: "var(--text3)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 2,
              }}
            >
              <Icon name="chevron-right" size={14} />
            </button>
          )}
        </div>

        {/* User card */}
        {!collapsed && (
          <div style={{ padding: "16px 18px 8px" }}>
            <div
              style={{
                padding: "11px 13px",
                background: meta.dim,
                borderRadius: "var(--r-md)",
                border: `1px solid ${meta.accent}25`,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: 2,
                  background: meta.accent,
                }}
              />
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 9,
                  textTransform: "uppercase",
                  letterSpacing: "1.6px",
                  color: meta.accent,
                  marginBottom: 4,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: meta.accent,
                    boxShadow: `0 0 8px ${meta.accent}`,
                    animation: "pulse 2s infinite",
                  }}
                />
                {meta.label}
              </div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 13,
                  color: "var(--text)",
                  letterSpacing: "-0.01em",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {user.name}
              </div>
            </div>
          </div>
        )}

        {/* Nav section label */}
        {!collapsed && (
          <div
            style={{
              padding: "16px 22px 6px",
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              textTransform: "uppercase",
              letterSpacing: "1.8px",
              color: "var(--text3)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Icon name="chevron-right" size={10} />
            Navigation
          </div>
        )}

        <nav
          style={{
            flex: 1,
            padding: collapsed ? "12px 10px" : "4px 12px",
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          {nav.map((item) => {
            const active = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNav(item.id)}
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
                  border: "1px solid transparent",
                  background: active ? meta.dim : "transparent",
                  borderColor: active ? `${meta.accent}30` : "transparent",
                  color: active ? meta.accent : "var(--text2)",
                  fontWeight: active ? 600 : 500,
                  fontSize: 13,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                  position: "relative",
                  fontFamily: "inherit",
                  letterSpacing: "-0.005em",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background =
                      "rgba(245,245,220,0.03)";
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
                {active && !collapsed && (
                  <span
                    aria-hidden
                    style={{
                      position: "absolute",
                      left: -12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: 3,
                      height: 18,
                      background: meta.accent,
                      borderRadius: "0 4px 4px 0",
                      boxShadow: `0 0 12px ${meta.accent}`,
                    }}
                  />
                )}
                <span
                  style={{
                    flexShrink: 0,
                    width: 18,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: active ? 1 : 0.85,
                  }}
                >
                  <Icon
                    name={item.icon}
                    size={16}
                    strokeWidth={active ? 2 : 1.75}
                  />
                </span>
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && item.badge ? (
                  <span
                    style={{
                      marginLeft: "auto",
                      background: meta.accent,
                      color: "var(--bg)",
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "1px 7px",
                      borderRadius: 20,
                      minWidth: 18,
                      textAlign: "center",
                    }}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Bottom — terminal-style status */}
        <div
          style={{
            padding: collapsed ? "12px 10px" : "12px 14px",
            borderTop: "1px solid var(--border)",
          }}
        >
          {!collapsed && (
            <div
              style={{
                padding: "8px 10px",
                marginBottom: 8,
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-sm)",
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "var(--text3)",
                display: "flex",
                alignItems: "center",
                gap: 7,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--gold)",
                  boxShadow: "0 0 8px var(--gold)",
                }}
              />
              <span>system.online</span>
            </div>
          )}
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
              border: "1px solid transparent",
              background: "transparent",
              color: "var(--text3)",
              cursor: "pointer",
              fontSize: 13,
              fontFamily: "inherit",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--danger)";
              e.currentTarget.style.borderColor = "rgba(194,84,80,0.25)";
              e.currentTarget.style.background = "var(--danger-dim)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text3)";
              e.currentTarget.style.borderColor = "transparent";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <Icon name="logout" size={15} />
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* ============================ MAIN ============================ */}
      <div
        style={{
          marginLeft: SIDEBAR_W,
          flex: 1,
          transition: "margin-left 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          minWidth: 0,
        }}
      >
        {/* Top header */}
        <header
          style={{
            height: 60,
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            padding: "0 32px",
            gap: 16,
            position: "sticky",
            top: 0,
            zIndex: 50,
            background: "rgba(4, 15, 15, 0.55)",
            backdropFilter: "blur(18px) saturate(1.4)",
            WebkitBackdropFilter: "blur(18px) saturate(1.4)",
          }}
        >
          {/* Breadcrumb / current page */}
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 10,
              minWidth: 0,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--text3)",
                letterSpacing: "0.5px",
              }}
            >
              ~/{meta.label.toLowerCase()}
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--text4)",
              }}
            >
              /
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: meta.accent,
                textTransform: "lowercase",
                letterSpacing: "0.5px",
                fontWeight: 500,
              }}
            >
              {(nav.find((n) => n.id === activePage)?.label || "—").toLowerCase()}
            </span>
          </div>

          {/* Date pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--text2)",
              padding: "5px 12px",
              border: "1px solid var(--border2)",
              borderRadius: 40,
              background: "var(--surface)",
              letterSpacing: "0.3px",
            }}
          >
            <Icon name="calendar" size={12} />
            {new Date().toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </div>

          {/* Avatar */}
          <ProfileAvatar
            name={user.name}
            initials={user.avatar}
            accent={meta.accent}
            size={36}
          />
        </header>

        <main style={{ flex: 1, overflowY: "auto", position: "relative" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
