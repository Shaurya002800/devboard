'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { clearStoredToken, getTokenPayload } from '@/lib/api'
import { useAuthToken } from '@/components/use-auth-token'

export function AuthStatus() {
  const router = useRouter()
  const { token } = useAuthToken()
  const user = getTokenPayload(token)

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/auth/login"
          className="btn-secondary hidden sm:inline-flex"
        >
          Log in
        </Link>
        <Link href="/auth/register" className="btn-primary inline-flex">
          Sign up
        </Link>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <p className="text-sm font-semibold">{user.name || 'Builder'}</p>
        <p className="text-xs text-[var(--muted)]">Ready to collaborate</p>
      </div>
      <button
        className="btn-secondary"
        type="button"
        onClick={() => {
          clearStoredToken()
          router.push('/')
          router.refresh()
        }}
      >
        Sign out
      </button>
    </div>
  )
}
