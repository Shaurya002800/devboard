'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  fetchMyApplications,
  fetchMyProjects,
  getTokenPayload,
  safeFetchCurrentUser,
} from '@/lib/api'
import { useAuthToken } from '@/components/use-auth-token'
import { formatStatusLabel, getStatusClassName } from '@/lib/status'

type CurrentUser = {
  id: string
  name: string
  email: string
  bio: string | null
  created_at: string
}

type ProfileProject = {
  id: string
  title: string
  applicant_count: number
  status: string
}

type ProfileApplication = {
  id: string
  project_title: string
  poster_name: string
  status: string
}

export default function ProfilePage() {
  const { token, ready } = useAuthToken()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [projects, setProjects] = useState<ProfileProject[]>([])
  const [applications, setApplications] = useState<ProfileApplication[]>([])

  useEffect(() => {
    if (!token) {
      return
    }

    async function loadProfile() {
      try {
        setLoading(true)
        setError('')
        const tokenUser = getTokenPayload(token)
        const [userResponse, projectResponse, applicationResponse] =
          await Promise.allSettled([
            safeFetchCurrentUser(),
            fetchMyProjects(),
            fetchMyApplications(),
          ])

        if (
          userResponse.status === 'fulfilled' &&
          userResponse.value.data?.user
        ) {
          setUser(userResponse.value.data.user)
        } else if (tokenUser) {
          setUser({
            id: tokenUser.id,
            name: tokenUser.name || 'Builder',
            email: tokenUser.email || '',
            bio: null,
            created_at: '',
          })
        }

        if (projectResponse.status === 'fulfilled') {
          setProjects(projectResponse.value.data)
        } else {
          setProjects([])
        }

        if (applicationResponse.status === 'fulfilled') {
          setApplications(applicationResponse.value)
        } else {
          setApplications([])
        }

        if (
          userResponse.status === 'rejected' &&
          projectResponse.status === 'rejected' &&
          applicationResponse.status === 'rejected'
        ) {
          throw new Error('Unable to load your profile data right now.')
        }
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Unable to load your profile.'
        )
      } finally {
        setLoading(false)
      }
    }

    void loadProfile()
  }, [token])

  if (!ready || (token && loading)) {
    return (
      <div className="obsidian-frame rounded-[2rem] p-8">
        Loading profile...
      </div>
    )
  }

  if (!token) {
    return (
      <div className="obsidian-frame rounded-[2rem] p-8 text-center">
        <p className="eyebrow">Private profile</p>
        <h1 className="mt-3 text-3xl font-semibold">
          Log in to view your profile
        </h1>
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

  if (error) {
    return (
      <div className="obsidian-frame rounded-[2rem] p-8">
        <p className="eyebrow">Profile unavailable</p>
        <h1 className="mt-3 text-3xl font-semibold">
          We couldn&apos;t load your profile
        </h1>
        <p className="mt-4 text-[var(--muted)]">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="obsidian-frame rounded-[2.2rem] p-6 sm:p-8">
        <p className="eyebrow">Profile</p>
        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">{user?.name}</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">{user?.email}</p>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
              {user?.bio ||
                'No bio added yet. Add one from your account flow or seed it in the database.'}
            </p>
          </div>
          <div className="grid gap-3 sm:min-w-64">
            <div className="obsidian-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                Posted projects
              </p>
              <p className="mt-2 text-3xl font-semibold">{projects.length}</p>
            </div>
            <div className="obsidian-stat">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                Applications sent
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {applications.length}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="obsidian-frame rounded-[2rem] p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold">Your projects</h2>
            <Link href="/projects/new" className="btn-primary">
              Post project
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {projects.length ? (
              projects.map((project) => (
                <div key={project.id} className="obsidian-stat">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{project.title}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {project.applicant_count} applicants
                      </p>
                    </div>
                    <span
                      className={`${getStatusClassName(project.status)} rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]`}
                    >
                      {formatStatusLabel(project.status)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--muted)]">
                No projects posted yet.
              </p>
            )}
          </div>
        </div>

        <div className="obsidian-frame rounded-[2rem] p-6">
          <h2 className="text-2xl font-semibold">Your applications</h2>
          <div className="mt-5 space-y-3">
            {applications.length ? (
              applications.map((application) => (
                <div key={application.id} className="obsidian-stat">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        {application.project_title}
                      </p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        Poster: {application.poster_name}
                      </p>
                    </div>
                    <span
                      className={`${getStatusClassName(application.status)} rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]`}
                    >
                      {formatStatusLabel(application.status)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--muted)]">
                You haven&apos;t applied to any projects yet.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
