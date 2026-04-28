'use client'

import Link from 'next/link'
import { ProjectForm } from '@/components/project-form'
import { useAuthToken } from '@/components/use-auth-token'

export default function NewProjectPage() {
  const { token, ready } = useAuthToken()

  if (!ready) {
    return (
      <div className="panel rounded-[2rem] p-8">Checking your session...</div>
    )
  }

  if (!token) {
    return (
      <div className="panel rounded-[2rem] p-8 text-center">
        <p className="eyebrow">Authentication required</p>
        <h1 className="mt-3 text-3xl font-semibold">
          Sign in before posting a project
        </h1>
        <p className="mt-4 text-[var(--muted)]">
          Your project will be linked to your profile so applicants can trust
          who they are reaching out to.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/auth/login" className="btn-primary">
            Log in
          </Link>
          <Link href="/auth/register" className="btn-secondary">
            Create account
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Post Project</p>
        <h1 className="mt-2 text-3xl font-semibold">
          Write a clear brief and attract better fits
        </h1>
      </div>
      <ProjectForm />
    </div>
  )
}
