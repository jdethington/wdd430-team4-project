'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string()
    .min(1, 'Email is required.')
    .email('Please enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });

  const [submitted, setSubmitted] = useState(false);

  function validate() {
    const result = LoginSchema.safeParse(formData);

    if (result.success) {
      setErrors({ email: '', password: '' });
      return true;
    }

    // flatten() organizes errors by field name
    const fieldErrors = result.error.flatten().fieldErrors;
    setErrors({
      email: fieldErrors.email?.[0] ?? '',
      password: fieldErrors.password?.[0] ?? '',
    });
    return false;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // clear error on change
    setErrors(prev => ({ ...prev, [name]: '' }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) {
      console.log('Form submitted:', formData);
      setSubmitted(true);
    }
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

        {/* Success state */}
        {submitted ? (
          <div className="bg-[#2c2c2c] border border-[#f5c518]/30 rounded-sm p-8 text-center">
            <p className="text-[#f5c518] text-lg font-semibold mb-2">
              Successfully logged in!
            </p>
            <p className="text-[#afb6c2] text-sm mb-6">
              (Backend wiring coming soon.)
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="bg-[#2c2c2c] border border-[#2c2c2c] rounded-sm p-8 space-y-5 shadow-lg"
          >

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
                className={`block w-full bg-[#1a1a1a] border px-4 py-3 text-sm text-[#f5f5f4] placeholder-[#afb6c2]/40 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#f5c518] transition-colors ${errors.email ? 'border-red-500' : 'border-[#afb6c2]/20 hover:border-[#afb6c2]/40'
                  }`}
                aria-describedby="email-error"
              />
              {errors.email && (
                <p id="email-error" className="mt-1.5 text-xs text-red-400" aria-live="polite">
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
                className={`block w-full bg-[#1a1a1a] border px-4 py-3 text-sm text-[#f5f5f4] placeholder-[#afb6c2]/40 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#f5c518] transition-colors ${errors.password ? 'border-red-500' : 'border-[#afb6c2]/20 hover:border-[#afb6c2]/40'
                  }`}
                aria-describedby="password-error"
              />
              {errors.password && (
                <p id="password-error" className="mt-1.5 text-xs text-red-400" aria-live="polite">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
            >
              Log in
            </Button>

            {/* Sign in link */}
            <p className="text-center text-sm text-[#afb6c2] pt-2">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="text-[#f5c518] hover:underline font-medium"
              >
                Create one
              </Link>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}