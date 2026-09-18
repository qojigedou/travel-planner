import type { ReactNode } from "react";
import { Link } from "react-router";
import { Logo } from "../../components/layout/Logo";

interface AuthLayoutProps {
  title: string;
  subtitle: ReactNode;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <aside className="auth-art relative hidden overflow-hidden lg:block">
        <div className="topo absolute inset-0 opacity-30" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Link to="/" className="w-fit rounded-lg [&_span]:text-white!">
            <Logo />
          </Link>
          <div className="max-w-md">
            <p className="font-display text-5xl font-medium leading-[1.08]" style={{ fontVariationSettings: '"SOFT" 100' }}>
              The best trips are the ones you actually plan.
            </p>
            <p className="mt-5 text-[17px] text-white/80">
              Name it, date it, pin the places you can't miss, and tick them off as you go.
            </p>
          </div>
          <div className="flex gap-8 text-sm text-white/75">
            <span>
              <strong className="block font-display text-3xl font-medium text-white">01</strong>Plan
            </span>
            <span>
              <strong className="block font-display text-3xl font-medium text-white">02</strong>Pin
            </span>
            <span>
              <strong className="block font-display text-3xl font-medium text-white">03</strong>Go
            </span>
          </div>
        </div>
      </aside>

      <main className="flex flex-col px-5 py-8 sm:px-10">
        <Link to="/" className="w-fit rounded-lg lg:hidden">
          <Logo />
        </Link>
        <div className="animate-rise mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="text-4xl font-medium">{title}</h1>
          <p className="mt-2 text-fg-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-8 text-center text-sm text-fg-muted">{footer}</div>
        </div>
      </main>
    </div>
  );
}
