import { useMutation } from "@tanstack/react-query";
import { request } from "../lib/api";
import { tokenStore } from "../lib/tokenStore";
import type { LoginResponse, MessageResponse } from "../lib/types";

export interface Credentials {
  email: string;
  password: string;
}

export function useLogin() {
  return useMutation({
    mutationFn: (credentials: Credentials) =>
      request<LoginResponse>("/login/", { method: "POST", body: credentials, skipRefresh: true }),
    onSuccess: (data, { email }) => {
      tokenStore.set({ access_token: data.access_token, refresh_token: data.refresh_token, email: email.toLowerCase() });
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (credentials: Credentials) =>
      request<{ id: number; email: string }>("/register/", { method: "POST", body: credentials, skipRefresh: true }),
  });
}

export function useActivate() {
  return useMutation({
    mutationFn: (input: { email: string; token: string }) =>
      request<MessageResponse>("/activate/", { method: "POST", body: input, skipRefresh: true }),
  });
}

export const PASSWORD_RULES = [
  { label: "8+ characters", test: (v: string) => v.length >= 8 },
  { label: "Uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { label: "Lowercase letter", test: (v: string) => /[a-z]/.test(v) },
  { label: "Number", test: (v: string) => /\d/.test(v) },
  { label: "Symbol  @ $ ! % * ? & #", test: (v: string) => /[@$!%*?&#]/.test(v) },
];
