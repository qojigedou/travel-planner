import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Moon, Sun } from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router";
import { toast } from "sonner";
import { useEffect } from "react";
import { useSession, useTheme } from "../../lib/hooks";
import { tokenStore } from "../../lib/tokenStore";
import { cx } from "../../lib/cx";
import { Button, ButtonLink } from "../ui/Button";
import { Logo } from "./Logo";

const API_DOCS_URL = import.meta.env.VITE_API_DOCS_URL || "http://localhost:80/docs";

const NAV = [
  { to: "/", label: "Trips", end: true },
  { to: "/places", label: "Places", end: false },
];

export function AppShell() {
  const session = useSession();
  const { theme, toggle } = useTheme();
  const qc = useQueryClient();
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  const signOut = () => {
    tokenStore.clear();
    qc.clear();
    toast.success("Signed out");
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-ink px-4 py-2 text-ink-fg focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/80 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:gap-6 sm:px-6">
          <NavLink to="/" aria-label="Waypoint home" className="rounded-lg">
            <Logo responsive />
          </NavLink>

          <nav aria-label="Main" className="flex items-center gap-1">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cx(
                    "rounded-full px-3.5 py-2 text-sm font-semibold transition-colors duration-150",
                    isActive ? "bg-surface-raised text-fg shadow-xs ring-1 ring-border" : "text-fg-muted hover:text-fg",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggle}
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            >
              {theme === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
            </Button>

            {session ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span
                  className="grid size-8 place-items-center rounded-full bg-primary-soft text-[13px] font-bold uppercase text-primary-soft-fg"
                  title={session.email}
                  aria-hidden
                >
                  {session.email[0]}
                </span>
                <span className="hidden max-w-40 truncate text-sm text-fg-muted md:block">{session.email}</span>
                <Button variant="ghost" size="icon-sm" onClick={signOut} aria-label="Sign out">
                  <LogOut className="size-[18px]" />
                </Button>
              </div>
            ) : (
              <ButtonLink to="/login" variant="secondary" size="sm">
                Sign in
              </ButtonLink>
            )}
          </div>
        </div>
      </header>

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-[13px] text-fg-subtle sm:flex-row sm:px-6">
          <span className="flex items-center gap-2">
            <Logo compact />
            Plan it. Pin it. Go.
          </span>
          <a href={API_DOCS_URL} target="_blank" rel="noreferrer" className="underline-offset-4 hover:text-fg hover:underline">
            API reference
          </a>
        </div>
      </footer>
    </div>
  );
}
