'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { loginUser, registerUser, setStoredToken } from '@/lib/api'
import { useToast } from '@/components/toast-provider'

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(formData: FormData) {
    const name = String(formData.get('name') || '').trim()
    const email = String(formData.get('email') || '').trim()
    const password = String(formData.get('password') || '')
    const bio = String(formData.get('bio') || '').trim()

    if (mode === 'register' && !name) {
      setError('Please enter your name.')
      return
    }

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    try {
      setLoading(true)
      setError('')

      const payload =
        mode === 'register'
          ? { name, email, password, bio }
          : { email, password }
      const response =
        mode === 'register'
          ? await registerUser(payload)
          : await loginUser(payload)

      setStoredToken(response.token)
      showToast(mode === 'register' ? 'Account created!' : 'Welcome back!')
      router.push('/dashboard')
      router.refresh()
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Something went wrong.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="panel fade-up rounded-[2rem] p-6 sm:p-8">
      <p className="eyebrow">
        {mode === 'register' ? 'Create account' : 'Welcome back'}
      </p>
      <h1 className="mt-3 text-3xl font-semibold">
        {mode === 'register' ? 'Join DevBoard' : 'Log in to your account'}
      </h1>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
        {mode === 'register'
          ? 'Set up your builder profile so you can post projects and apply with a clear intro.'
          : 'Jump back in to manage your listings and track applications.'}
      </p>

      <form
        className="mt-8 space-y-4"
        action={async (formData) => {
          await handleSubmit(formData)
        }}
      >
        {mode === 'register' ? (
          <div>
            <label
              className="mb-2 block text-sm font-semibold text-[var(--muted)]"
              htmlFor="name"
            >
              Full name
            </label>
            <input
              id="name"
              name="name"
              className="input"
              placeholder="Alex Johnson"
            />
          </div>
        ) : null}

        <div>
          <label
            className="mb-2 block text-sm font-semibold text-[var(--muted)]"
            htmlFor="email"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="input"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label
            className="mb-2 block text-sm font-semibold text-[var(--muted)]"
            htmlFor="password"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className="input"
            placeholder="At least 8 characters"
          />
        </div>

        {mode === 'register' ? (
          <div>
            <label
              className="mb-2 block text-sm font-semibold text-[var(--muted)]"
              htmlFor="bio"
            >
              Short bio
            </label>
            <textarea
              id="bio"
              name="bio"
              className="input min-h-28"
              placeholder="Product-minded frontend developer who likes MVPs..."
            />
          </div>
        ) : null}

        {error ? (
          <p className="rounded-2xl border border-[rgba(162,48,48,0.18)] bg-[rgba(162,48,48,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
            {error}
          </p>
        ) : null}

        <button
          className="btn-primary w-full justify-center"
          disabled={loading}
          type="submit"
        >
          {loading
            ? 'Please wait...'
            : mode === 'register'
              ? 'Create account'
              : 'Log in'}
        </button>
      </form>

      <p className="mt-6 text-sm text-[var(--muted)]">
        {mode === 'register'
          ? 'Already have an account?'
          : "Don't have an account?"}{' '}
        <Link
          href={mode === 'register' ? '/auth/login' : '/auth/register'}
          className="font-semibold text-[var(--brand-dark)]"
        >
          {mode === 'register' ? 'Log in' : 'Sign up'}
        </Link>
      </p>
    </div>
  )
}
