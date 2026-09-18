import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { useActivate } from "../../api/auth";
import { Button } from "../../components/ui/Button";
import { Field, Input } from "../../components/ui/Field";
import { errorMessage } from "../../lib/api";
import { AuthLayout } from "./AuthLayout";

export function ActivatePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const activate = useActivate();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [token, setToken] = useState(params.get("token") ?? "");
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!email.trim() || !token.trim()) {
      setError("Both your email and the activation token are needed.");
      return;
    }
    try {
      const res = await activate.mutateAsync({ email: email.trim(), token: token.trim() });
      toast.success(res.message);
      navigate(`/login?email=${encodeURIComponent(email.trim())}`, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <AuthLayout
      title="Activate account"
      subtitle="Enter the activation token issued for your account. Tokens expire after 24 hours."
      footer={
        <Link to="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        {error && (
          <div role="alert" className="rounded-xl border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger-soft-fg">
            {error}
          </div>
        )}
        <Field label="Email">
          {(props) => (
            <Input
              {...props}
              type="email"
              autoComplete="email"
              autoFocus={!email}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}
        </Field>
        <Field label="Activation token">
          {(props) => (
            <Input
              {...props}
              autoFocus={Boolean(email)}
              autoComplete="one-time-code"
              spellCheck={false}
              className="font-mono text-sm"
              placeholder="Paste your token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          )}
        </Field>
        <Button type="submit" size="lg" className="mt-1 w-full" loading={activate.isPending}>
          Activate
        </Button>
      </form>
    </AuthLayout>
  );
}
