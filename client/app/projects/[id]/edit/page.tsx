'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { ProjectForm } from '@/components/project-form'
import { fetchProject, getTokenPayload } from '@/lib/api'

type EditableProject = {
  id: string
  title: string
  description: string
  tech_stack: string[]
  budget: number | null
  deadline: string | null
  status: 'open' | 'closed' | 'in_progress'
  poster_id: string
}

export default function EditProjectPage() {
  const params = useParams<{ id: string }>()
  const user = useMemo(() => getTokenPayload(), [])
  const [project, setProject] = useState<EditableProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadProject() {
      try {
        setLoading(true)
        setError('')
        const data = await fetchProject(params.id)
        setProject(data)
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Unable to load project.'
        )
      } finally {
        setLoading(false)
      }
    }

    void loadProject()
  }, [params.id])

  if (loading) {
    return (
      <div className="panel rounded-[2rem] p-8">Loading project editor...</div>
    )
  }

  if (error || !project) {
    return (
      <div className="panel rounded-[2rem] p-8">
        <p className="eyebrow">Project edit</p>
        <h1 className="mt-3 text-3xl font-semibold">
          We couldn&apos;t open this project
        </h1>
        <p className="mt-4 text-[var(--muted)]">
          {error || 'Project not found.'}
        </p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="panel rounded-[2rem] p-8 text-center">
        <p className="eyebrow">Authentication required</p>
        <h1 className="mt-3 text-3xl font-semibold">
          Log in before editing a project
        </h1>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/auth/login" className="btn-primary">
            Log in
          </Link>
          <Link href={`/projects/${project.id}`} className="btn-secondary">
            Back to project
          </Link>
        </div>
      </div>
    )
  }

  if (user.id !== project.poster_id) {
    return (
      <div className="panel rounded-[2rem] p-8 text-center">
        <p className="eyebrow">Owner only</p>
        <h1 className="mt-3 text-3xl font-semibold">
          Only the poster can edit this project
        </h1>
        <p className="mt-4 text-[var(--muted)]">
          You can still view the project or apply if it is open.
        </p>
        <Link
          href={`/projects/${project.id}`}
          className="btn-primary mt-6 inline-flex"
        >
          Back to project
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Edit Project</p>
        <h1 className="mt-2 text-3xl font-semibold">
          Refine the brief and keep applicants aligned
        </h1>
      </div>
      <ProjectForm
        mode="edit"
        projectId={project.id}
        initialValues={{
          title: project.title,
          description: project.description,
          tech_stack: project.tech_stack.join(', '),
          budget: project.budget !== null ? String(project.budget) : '',
          deadline: project.deadline ? project.deadline.slice(0, 10) : '',
          status: project.status,
        }}
      />
    </div>
  )
}
