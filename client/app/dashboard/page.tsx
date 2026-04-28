'use client'

import Link from 'next/link'
import { DashboardPanel } from '@/components/dashboard-panel'
import { useAuthToken } from '@/components/use-auth-token'

export default function DashboardPage() {
  const { token, ready } = useAuthToken()

  if (!ready) {
    return (
      <div className="panel rounded-[2rem] p-8">Loading your dashboard...</div>
    )
  }

  if (!token) {
    return (
      <div className="panel rounded-[2rem] p-8 text-center">
        <p className="eyebrow">Private dashboard</p>
        <h1 className="mt-3 text-3xl font-semibold">
          Log in to see your posts and applications
        </h1>
        <p className="mt-4 text-[var(--muted)]">
          The dashboard keeps your own listings and application history in one
          place.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/auth/login" className="btn-primary">
            Log in
          </Link>
          <Link href="/auth/register" className="btn-secondary">
            Sign up
          </Link>
        </div>
      </div>
    )
  }

  return <DashboardPanel />
}
