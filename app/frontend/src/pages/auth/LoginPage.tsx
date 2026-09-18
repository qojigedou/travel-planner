import { KeyRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { useLogin } from "../../api/auth";
import { Button } from "../../components/ui/Button";
import { Field, Input } from "../../components/ui/Field";
import { ApiError, errorMessage } from "../../lib/api";
import { AuthLayout } from "./AuthLayout";
import { PasswordInput } from "./PasswordInput";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const login = useLogin();

  const [email, setEmail] = useState(params.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<{ message: string; inactive?: boolean } | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!email || !password) {
      setError({ message: "Enter your email and password." });
      return;
    }
    try {
      await login.mutateAsync({ email: email.trim(), password });
      toast.success("Welcome back");
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? "/", { replace: true });
    } catch (err) {
      setError({
        message: err instanceof ApiError && err.status === 401 ? "That email and password don't match." : errorMessage(err),
        inactive: err instanceof ApiError && err.status === 403,
      });
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to pick up where you left off."
      footer={
        <>
          New here?{" "}
          <Link to="/register" className="font-semibold text-primary underline-offset-4 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        {error && (
          <div role="alert" className="rounded-xl border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger-soft-fg">
            {error.message}
            {error.inactive && (
              <Link
                to={`/activate?email=${encodeURIComponent(email)}`}
                className="mt-1 flex items-center gap-1.5 font-semibold underline underline-offset-4"
              >
                <KeyRound className="size-3.5" /> Activate your account
              </Link>
            )}
          </div>
        )}

        <Field label="Email">
          {(props) => (
            <Input
              {...props}
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}
        </Field>

        <Field label="Password">
          {(props) => (
            <PasswordInput {...props} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          )}
        </Field>

        <Button type="submit" size="lg" className="mt-1 w-full" loading={login.isPending}>
          Sign in
        </Button>

        <p className="text-center text-[13px] text-fg-muted">
          Got an activation token?{" "}
          <Link to="/activate" className="font-semibold text-fg underline-offset-4 hover:underline">
            Activate account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
