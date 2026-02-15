"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toFriendlyError } from "../../lib/error-format";
import { InlineNotice } from "./InlineNotice";
import { useSession } from "./session-context";

const navItems = [
  { href: "/app/dashboard", label: "Dashboard" },
  { href: "/app/send", label: "Send" },
  { href: "/app/activity", label: "Activity" }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, appUserId, backendError } = useSession();
  const friendly = backendError ? toFriendlyError(backendError) : null;

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      router.replace("/");
    }
  };

  return (
    <main className="app-shell">
      <aside className="sidebar panel">
        <div>
          <p className="brand-mark">
            <span className="brand-script">Temvy</span>
            <span className="brand-sans">Wallet</span>
          </p>
          <p className="meta-text">Invisible wallet interface</p>
        </div>

        <nav className="sidebar-nav" aria-label="Main">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? "nav-link active" : "nav-link"}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="sidebar-user panel">
            <p className="meta-text">Authenticated user</p>
            <p className="sidebar-user-id">{appUserId ?? "unknown"}</p>
          </div>
          <button type="button" className="btn btn-secondary" onClick={() => void handleLogout()}>
            Logout
          </button>
        </div>
      </aside>

      <section className="app-main">
        <header className="app-topbar panel">
          <div>
            {/* <p className="meta-text">Backend integrated</p> */}
            <h1>Command Dashboard</h1>
          </div>
          <span className="chip chip-success">Privy session active</span>
        </header>

        {friendly ? <InlineNotice title={friendly.title} message={friendly.message} variant="error" /> : null}
        {children}
      </section>
    </main>
  );
}
