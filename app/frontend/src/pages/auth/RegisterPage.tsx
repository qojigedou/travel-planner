import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { PASSWORD_RULES, useRegister } from "../../api/auth";
import { Button } from "../../components/ui/Button";
import { Field, Input } from "../../components/ui/Field";
import { ApiError, errorMessage } from "../../lib/api";
import { AuthLayout } from "./AuthLayout";
import { PasswordInput, PasswordRules } from "./PasswordInput";

export function RegisterPage() {
  const navigate = useNavigate();
  const register = useRegister();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const next: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = "Enter a valid email address.";
    if (!PASSWORD_RULES.every((rule) => rule.test(password))) next.password = "Your password doesn't meet all the rules yet.";
    setErrors(next);
    if (Object.keys(next).length) return;

    try {
      const user = await register.mutateAsync({ email: email.trim(), password });
      toast.success("Account created", { description: "Activate it with your token to sign in." });
      navigate(`/activate?email=${encodeURIComponent(user.email)}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setErrors({ email: "An account with this email already exists." });
      } else if (err instanceof ApiError && Object.keys(err.fields).length) {
        setErrors({ email: err.fields.email, password: err.fields.password });
      } else {
        toast.error(errorMessage(err));
      }
    }
  };

  return (
    <AuthLayout
      title="Start planning"
      subtitle="Create an account. It takes about twenty seconds."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <Field label="Email" error={errors.email}>
          {(props) => (
            <Input
              {...props}
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((v) => ({ ...v, email: undefined }));
              }}
            />
          )}
        </Field>

        <Field label="Password" error={errors.password}>
          {(props) => (
            <PasswordInput
              {...props}
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((v) => ({ ...v, password: undefined }));
              }}
            />
          )}
        </Field>

        <PasswordRules value={password} />

        <Button type="submit" size="lg" className="mt-1 w-full" loading={register.isPending}>
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
