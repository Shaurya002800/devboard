'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  deleteProject,
  fetchMyApplications,
  fetchMyProjects,
  fetchProjectApplications,
  updateApplicationStatus,
} from '@/lib/api'
import { EmptyState } from '@/components/empty-state'
import { useToast } from '@/components/toast-provider'

type TabKey = 'posts' | 'apps'
type ProjectSummary = {
  id: string
  title: string
  applicant_count: number
  deadline: string | null
  status: string
}

type ApplicationSummary = {
  id: string
  pitch: string
  status: string
  project_id: string
  project_title: string
  poster_name: string
}

type ApplicantSummary = {
  id: string
  name: string
  email: string
  bio: string | null
  pitch: string
  status: string
}

export function DashboardPanel() {
  const { showToast } = useToast()
  const [tab, setTab] = useState<TabKey>('posts')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [applications, setApplications] = useState<ApplicationSummary[]>([])
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(
    null
  )
  const [projectApplicants, setProjectApplicants] = useState<
    Record<string, ApplicantSummary[]>
  >({})
  const [reviewLoadingProjectId, setReviewLoadingProjectId] = useState<
    string | null
  >(null)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError('')
        const [projectResponse, applicationResponse] = await Promise.all([
          fetchMyProjects(),
          fetchMyApplications(),
        ])
        setProjects(projectResponse.data)
        setApplications(applicationResponse)
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Unable to load your dashboard.'
        )
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [])

  async function handleDelete(projectId: string) {
    try {
      await deleteProject(projectId)
      setProjects((current) =>
        current.filter((project) => project.id !== projectId)
      )
      showToast('Project deleted.')
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Unable to delete project.'
      )
    }
  }

  async function handleToggleApplicants(projectId: string) {
    if (expandedProjectId === projectId) {
      setExpandedProjectId(null)
      return
    }

    setExpandedProjectId(projectId)

    if (projectApplicants[projectId]) {
      return
    }

    try {
      setReviewLoadingProjectId(projectId)
      const applicants = await fetchProjectApplications(projectId)
      setProjectApplicants((current) => ({
        ...current,
        [projectId]: applicants,
      }))
    } catch (reviewError) {
      showToast(
        reviewError instanceof Error
          ? reviewError.message
          : 'Unable to load applicants.'
      )
    } finally {
      setReviewLoadingProjectId(null)
    }
  }

  async function handleApplicationReview(
    projectId: string,
    applicationId: string,
    status: 'accepted' | 'rejected'
  ) {
    try {
      await updateApplicationStatus(applicationId, { status })
      const [applicants, projectResponse] = await Promise.all([
        fetchProjectApplications(projectId),
        fetchMyProjects(),
      ])
      setProjectApplicants((current) => ({
        ...current,
        [projectId]: applicants,
      }))
      setProjects(projectResponse.data)
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

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold">
          Track your listings and applications
        </h1>
      </div>

      <div className="segment-control inline-flex rounded-full p-1">
        <button
          className="segment-option"
          data-active={tab === 'posts'}
          onClick={() => setTab('posts')}
          type="button"
        >
          My posts
        </button>
        <button
          className="segment-option"
          data-active={tab === 'apps'}
          onClick={() => setTab('apps')}
          type="button"
        >
          My apps
        </button>
      </div>

      {loading ? (
        <div className="panel rounded-[2rem] p-8">
          Loading your workspace...
        </div>
      ) : error ? (
        <div className="panel rounded-[2rem] p-8">
          <p className="eyebrow">Dashboard unavailable</p>
          <h2 className="mt-3 text-2xl font-semibold">
            We couldn&apos;t load your dashboard
          </h2>
          <p className="mt-3 text-[var(--muted)]">{error}</p>
        </div>
      ) : tab === 'posts' ? (
        projects.length ? (
          <div className="grid gap-4">
            {projects.map((project) => (
              <div key={project.id} className="panel rounded-[1.75rem] p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xl font-semibold">{project.title}</p>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      {project.applicant_count} applicants • {project.status} •
                      Deadline{' '}
                      {project.deadline
                        ? new Date(project.deadline).toLocaleDateString()
                        : 'TBD'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/projects/${project.id}`}
                      className="btn-secondary"
                    >
                      View
                    </Link>
                    <Link
                      href={`/projects/${project.id}/edit`}
                      className="btn-secondary"
                    >
                      Edit
                    </Link>
                    <button
                      className="btn-secondary"
                      onClick={() => handleToggleApplicants(project.id)}
                      type="button"
                    >
                      {expandedProjectId === project.id
                        ? 'Hide applicants'
                        : 'Review applicants'}
                    </button>
                    <button
                      className="btn-primary"
                      onClick={() => handleDelete(project.id)}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {expandedProjectId === project.id ? (
                  <div className="mt-5 border-t border-[var(--line)] pt-5">
                    {reviewLoadingProjectId === project.id ? (
                      <p className="text-sm text-[var(--muted)]">
                        Loading applicants...
                      </p>
                    ) : projectApplicants[project.id]?.length ? (
                      <div className="space-y-3">
                        {projectApplicants[project.id].map((application) => (
                          <div
                            key={application.id}
                            className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-strong)] p-4"
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <p className="font-semibold">
                                  {application.name}
                                </p>
                                <p className="text-xs text-[var(--muted)]">
                                  {application.email}
                                </p>
                              </div>
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
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
                                onClick={() =>
                                  handleApplicationReview(
                                    project.id,
                                    application.id,
                                    'accepted'
                                  )
                                }
                                type="button"
                              >
                                Accept
                              </button>
                              <button
                                className="btn-secondary"
                                onClick={() =>
                                  handleApplicationReview(
                                    project.id,
                                    application.id,
                                    'rejected'
                                  )
                                }
                                type="button"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--muted)]">
                        No applicants yet for this project.
                      </p>
                    )}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No projects yet. Be the first to post one."
            description="Write a concise brief, add your stack and budget, and start receiving applications."
            ctaHref="/projects/new"
            ctaLabel="Post your first project"
          />
        )
      ) : applications.length ? (
        <div className="grid gap-4">
          {applications.map((application) => (
            <div key={application.id} className="panel rounded-[1.75rem] p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xl font-semibold">
                    {application.project_title}
                  </p>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Posted by {application.poster_name} • Status{' '}
                    {application.status}
                  </p>
                </div>
                <Link
                  href={`/projects/${application.project_id}`}
                  className="btn-primary"
                >
                  Open project
                </Link>
              </div>
              <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                {application.pitch}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="You haven't applied anywhere yet."
          description="Find a project that fits your stack, send a strong pitch, and start building something useful."
          ctaHref="/"
          ctaLabel="Browse projects"
        />
      )}
    </div>
  )
}
