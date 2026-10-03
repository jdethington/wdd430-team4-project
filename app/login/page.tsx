"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";

import Button from "@/components/ui/Button";

const LoginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required.")
    .email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export default function Login() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({
    email: "",
    password: "",
    general: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate() {
    const result = LoginSchema.safeParse(formData);

    if (result.success) {
      setErrors({
        email: "",
        password: "",
        general: "",
      });
      return true;
    }

    const fieldErrors = result.error.flatten().fieldErrors;

    setErrors({
      email: fieldErrors.email?.[0] ?? "",
      password: fieldErrors.password?.[0] ?? "",
      general: "",
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
      general: "",
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setErrors((prev) => ({
      ...prev,
      general: "",
    }));

    const result = await signIn("credentials", {
      email: formData.email,
      password: formData.password,
      redirect: false,
    });

    if (result?.error) {
      setErrors((prev) => ({
        ...prev,
        general: "Invalid email or password.",
      }));
      setIsSubmitting(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="relative overflow-hidden min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Decorative header */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="h-[1px] w-12 bg-[#f5c518]" />
          <span className="text-[#f5c518] text-xs uppercase tracking-[0.3em] font-semibold">
            Log in
          </span>
          <div className="h-[1px] w-12 bg-[#f5c518]" />
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="bg-[#2c2c2c] border border-[#2c2c2c] rounded-sm p-8 space-y-5 shadow-lg"
        >
          {/* General authentication error */}
          {errors.general && (
            <div
              className="border border-red-500/40 bg-red-500/10 rounded-sm p-3"
              role="alert"
            >
              <p className="text-sm text-red-400">{errors.general}</p>
            </div>
          )}

          {/* Email */}
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

          {/* Password */}
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
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              placeholder="********"
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

          {/* Submit */}
          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Logging in..." : "Log in"}
          </Button>

          {/* Sign up link */}
          <p className="text-center text-sm text-[#afb6c2] pt-2">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-[#f5c518] hover:underline font-medium"
            >
              Create one
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
