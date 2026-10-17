'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthToken } from '@/components/use-auth-token'
import {
  createApplication,
  fetchMyApplications,
  fetchProjectApplications,
  getTokenPayload,
  safeFetchCurrentUser,
  updateApplicationStatus,
} from '@/lib/api'
import { useToast } from '@/components/toast-provider'

type Project = {
  id: string
  title: string
  poster_id: string
  status: string
  applicant_count: number
}

type Application = {
  id: string
  pitch: string
  status: string
  name: string
  email: string
  bio: string | null
}

export function ApplyPanel({ project }: { project: Project }) {
  const { showToast } = useToast()
  const router = useRouter()
  const { token } = useAuthToken()
  const [pitch, setPitch] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [applications, setApplications] = useState<Application[]>([])
  const [reviewLoading, setReviewLoading] = useState(false)
  const [alreadyApplied, setAlreadyApplied] = useState(false)
  const [applySuccess, setApplySuccess] = useState(false)
  const [applyStateLoading, setApplyStateLoading] = useState(false)
  const [currentUserName, setCurrentUserName] = useState('')

  const user = useMemo(() => getTokenPayload(token), [token])
  const isOwner = user?.id === project.poster_id

  useEffect(() => {
    if (!isOwner) {
      return
    }

    async function loadApplications() {
      try {
        setReviewLoading(true)
        const data = await fetchProjectApplications(project.id)
        setApplications(data)
      } catch {
        setApplications([])
      } finally {
        setReviewLoading(false)
      }
    }

    void loadApplications()
  }, [isOwner, project.id])

  useEffect(() => {
    if (!user || isOwner) {
      return
    }

    async function loadApplicationState() {
      try {
        setApplyStateLoading(true)
        const data = await fetchMyApplications()
        const hasApplied = data.some(
          (application: { project_id: string }) =>
            application.project_id === project.id
        )
        setAlreadyApplied(hasApplied)
      } catch {
        setAlreadyApplied(false)
      } finally {
        setApplyStateLoading(false)
      }
    }

    void loadApplicationState()
  }, [isOwner, project.id, user])

  useEffect(() => {
    if (!user) {
      return
    }

    async function loadCurrentUser() {
      try {
        const response = await safeFetchCurrentUser()
        setCurrentUserName(response.data?.user?.name || user.name || '')
      } catch {
        setCurrentUserName(user.name || '')
      }
    }

    void loadCurrentUser()
  }, [user])

  async function handleApply() {
    if (!user) {
      setError('Please log in before applying to a project.')
      return
    }

    if (alreadyApplied) {
      setError('You have already applied to this project.')
      return
    }

    if (project.status !== 'open') {
      setError('This project is no longer accepting applications.')
      return
    }

    if (!pitch.trim()) {
      setError('Please tell the poster why you are a good fit.')
      return
    }

    try {
      setLoading(true)
      setError('')
      await createApplication({ project_id: project.id, pitch })
      setPitch('')
      setAlreadyApplied(true)
      setApplySuccess(true)
      showToast('Application sent!')
      router.refresh()
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to send application.'
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleReview(
    applicationId: string,
    status: 'accepted' | 'rejected'
  ) {
    try {
      await updateApplicationStatus(applicationId, { status })
      setApplications(await fetchProjectApplications(project.id))
      router.refresh()
      showToast(
        status === 'accepted'
          ? 'Application accepted!'
          : 'Application rejected.'
      )
    } catch (reviewError) {
      showToast(
        reviewError instanceof Error
          ? reviewError.message
          : 'Unable to update application.'
      )
    }
  }

  if (isOwner) {
    return (
      <div className="obsidian-frame rounded-[2rem] p-6">
        <p className="eyebrow">Applicant review</p>
        <h2 className="mt-3 text-2xl font-semibold">Manage responses</h2>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Review incoming applications here and accept or reject them without
          leaving the project.
        </p>

        <div className="mt-5 space-y-3">
          {reviewLoading ? (
            <div className="obsidian-stat text-sm text-[var(--muted)]">
              Loading applicants...
            </div>
          ) : applications.length ? (
            applications.map((application) => (
              <div key={application.id} className="obsidian-stat">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{application.name}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {application.email}
                    </p>
                  </div>
                  <span className="status-pill rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                    {application.status}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  {application.pitch}
                </p>
                {application.bio ? (
                  <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                    {application.bio}
                  </p>
                ) : null}
                <div className="mt-4 flex gap-2">
                  <button
                    className="btn-primary"
                    onClick={() => handleReview(application.id, 'accepted')}
                    type="button"
                  >
                    Accept
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => handleReview(application.id, 'rejected')}
                    type="button"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="obsidian-stat border-dashed text-sm text-[var(--muted)]">
              No applicants yet. Share the listing and come back once responses
              start coming in.
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="obsidian-frame rounded-[2rem] p-6">
      <p className="eyebrow">Apply now</p>
      <h2 className="mt-3 text-2xl font-semibold">Send a focused pitch</h2>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
        Mention the stack you know, what you can ship, and how quickly you can
        start.
      </p>

      {!user ? (
        <div className="obsidian-stat mt-5 border-dashed text-sm text-[var(--muted)]">
          Log in first so your application is linked to your profile.
        </div>
      ) : null}

      {user && currentUserName ? (
        <div className="mt-5 rounded-[1.5rem] border border-[var(--line)] bg-[rgba(249,115,22,0.05)] px-4 py-3 text-sm text-[var(--muted)]">
          Applying as{' '}
          <span className="font-semibold text-[var(--ink)]">
            {currentUserName}
          </span>
        </div>
      ) : null}

      {project.status !== 'open' ? (
        <div className="obsidian-stat mt-5 border-dashed text-sm text-[var(--muted)]">
          This project is currently closed for new applications.
        </div>
      ) : null}

      {applySuccess ? (
        <div className="mt-5 rounded-[1.5rem] border border-[rgba(249,115,22,0.2)] bg-[rgba(249,115,22,0.08)] p-4 text-sm text-[var(--brand-dark)]">
          Application sent successfully. You can track it from your dashboard.
        </div>
      ) : null}

      {alreadyApplied && !applySuccess ? (
        <div className="mt-5 rounded-[1.5rem] border border-[rgba(249,115,22,0.2)] bg-[rgba(249,115,22,0.08)] p-4 text-sm text-[var(--brand-dark)]">
          You already applied to this project. Check your dashboard for updates.
        </div>
      ) : null}

      <textarea
        className="input mt-5 min-h-36"
        value={pitch}
        onChange={(event) => setPitch(event.target.value)}
        disabled={!user || alreadyApplied || project.status !== 'open'}
        placeholder="Hi, I’ve shipped two React dashboards recently and can take this from idea to deployment in one week..."
      />

      {error ? (
        <p className="mt-4 rounded-2xl border border-[rgba(162,48,48,0.18)] bg-[rgba(162,48,48,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}

      <button
        className="btn-primary mt-5 w-full justify-center"
        disabled={
          loading ||
          applyStateLoading ||
          !user ||
          alreadyApplied ||
          project.status !== 'open'
        }
        type="button"
        onClick={handleApply}
      >
        {loading
          ? 'Sending...'
          : applyStateLoading
            ? 'Checking...'
            : alreadyApplied
              ? 'Already applied'
              : project.status !== 'open'
                ? 'Applications closed'
                : !user
                  ? 'Log in to apply'
                  : 'Apply to project'}
      </button>
    </div>
  )
}
