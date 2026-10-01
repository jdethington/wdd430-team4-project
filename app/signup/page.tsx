"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { z } from "zod";

const SignupSchema = z
  .object({
    name: z.string().min(1, "Name is required."),
    email: z
      .string()
      .min(1, "Email is required.")
      .email("Please enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type FormErrors = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function Signup() {
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<FormErrors>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  function validate() {
    const result = SignupSchema.safeParse(formData);

    if (result.success) {
      setErrors({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      return true;
    }

    const fieldErrors = result.error.flatten().fieldErrors;

    setErrors({
      name: fieldErrors.name?.[0] ?? "",
      email: fieldErrors.email?.[0] ?? "",
      password: fieldErrors.password?.[0] ?? "",
      confirmPassword: fieldErrors.confirmPassword?.[0] ?? "",
    });

    return false;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));

    setServerError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setServerError("");

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          setErrors((prev) => ({
            ...prev,
            name: data.errors.name ?? "",
            email: data.errors.email ?? "",
            password: data.errors.password ?? "",
          }));
        }

        setServerError(
          data.error ?? "Unable to create account. Please try again.",
        );

        return;
      }

      const loginResult = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (loginResult?.error) {
        setServerError(
          "Account created, but automatic sign in failed. Please log in.",
        );
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setServerError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative overflow-hidden min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="h-[1px] w-12 bg-[#f5c518]" />

          <span className="text-[#f5c518] text-xs uppercase tracking-[0.3em] font-semibold">
            Create an Account
          </span>

          <div className="h-[1px] w-12 bg-[#f5c518]" />
        </div>

        <h1 className="text-3xl font-extrabold text-[#f5f5f4] tracking-wide text-center mb-2">
          Join Watch<span className="text-[#f5c518]">List</span>
        </h1>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="bg-[#2c2c2c] border border-[#2c2c2c] rounded-sm p-8 space-y-5 shadow-lg"
        >
          {serverError && (
            <div
              className="border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400"
              role="alert"
            >
              {serverError}
            </div>
          )}

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-[#afb6c2] mb-1.5 uppercase tracking-wider"
            >
              Name
            </label>

            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your full name"
              className={`block w-full bg-[#1a1a1a] border px-4 py-3 text-sm text-[#f5f5f4] placeholder-[#afb6c2]/40 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#f5c518] transition-colors ${
                errors.name
                  ? "border-red-500"
                  : "border-[#afb6c2]/20 hover:border-[#afb6c2]/40"
              }`}
              aria-describedby="name-error"
            />

            {errors.name && (
              <p
                id="name-error"
                className="mt-1.5 text-xs text-red-400"
                aria-live="polite"
              >
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[#afb6c2] mb-1.5 uppercase tracking-wider"
            >
              Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className={`block w-full bg-[#1a1a1a] border px-4 py-3 text-sm text-[#f5f5f4] placeholder-[#afb6c2]/40 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#f5c518] transition-colors ${
                errors.email
                  ? "border-red-500"
                  : "border-[#afb6c2]/20 hover:border-[#afb6c2]/40"
              }`}
              aria-describedby="email-error"
            />

            {errors.email && (
              <p
                id="email-error"
                className="mt-1.5 text-xs text-red-400"
                aria-live="polite"
              >
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[#afb6c2] mb-1.5 uppercase tracking-wider"
            >
              Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 8 characters"
              className={`block w-full bg-[#1a1a1a] border px-4 py-3 text-sm text-[#f5f5f4] placeholder-[#afb6c2]/40 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#f5c518] transition-colors ${
                errors.password
                  ? "border-red-500"
                  : "border-[#afb6c2]/20 hover:border-[#afb6c2]/40"
              }`}
              aria-describedby="password-error"
            />

            {errors.password && (
              <p
                id="password-error"
                className="mt-1.5 text-xs text-red-400"
                aria-live="polite"
              >
                {errors.password}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-[#afb6c2] mb-1.5 uppercase tracking-wider"
            >
              Confirm Password
            </label>

            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Repeat your password"
              className={`block w-full bg-[#1a1a1a] border px-4 py-3 text-sm text-[#f5f5f4] placeholder-[#afb6c2]/40 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#f5c518] transition-colors ${
                errors.confirmPassword
                  ? "border-red-500"
                  : "border-[#afb6c2]/20 hover:border-[#afb6c2]/40"
              }`}
              aria-describedby="confirmPassword-error"
            />

            {errors.confirmPassword && (
              <p
                id="confirmPassword-error"
                className="mt-1.5 text-xs text-red-400"
                aria-live="polite"
              >
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </Button>

          <p className="text-center text-sm text-[#afb6c2] pt-2">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[#f5c518] hover:underline font-medium"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
