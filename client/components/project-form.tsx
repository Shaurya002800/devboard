'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createProject, updateProject } from '@/lib/api'
import { useToast } from '@/components/toast-provider'

type ProjectFormProps = {
  mode?: 'create' | 'edit'
  projectId?: string
  initialValues?: {
    title: string
    description: string
    tech_stack: string
    budget: string
    deadline: string
    status: 'open' | 'closed'
  }
}

const defaultValues = {
  title: '',
  description: '',
  tech_stack: '',
  budget: '',
  deadline: '',
  status: 'open' as const,
}

export function ProjectForm({
  mode = 'create',
  projectId,
  initialValues = defaultValues,
}: ProjectFormProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(formData: FormData) {
    const title = String(formData.get('title') || '').trim()
    const description = String(formData.get('description') || '').trim()
    const techStack = String(formData.get('tech_stack') || '').trim()
    const budget = String(formData.get('budget') || '').trim()
    const deadline = String(formData.get('deadline') || '').trim()
    const status = String(formData.get('status') || 'open').trim()

    if (!title || !description || !techStack || !deadline) {
      setError('Please fill in title, description, tech stack, and deadline.')
      return
    }

    try {
      setLoading(true)
      setError('')

      const payload = {
        title,
        description,
        tech_stack: techStack.split(',').map((item) => item.trim()),
        budget: budget ? Number(budget) : null,
        deadline,
        status,
      }
      const project =
        mode === 'edit' && projectId
          ? await updateProject(projectId, payload)
          : await createProject(payload)

      showToast(mode === 'edit' ? 'Project updated!' : 'Project posted!')
      router.push(`/projects/${project.id}`)
      router.refresh()
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : `Unable to ${mode === 'edit' ? 'update' : 'create'} project.`
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      className="obsidian-frame rounded-[2rem] p-6 sm:p-8"
      action={async (formData) => {
        await handleSubmit(formData)
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label
            className="mb-2 block text-sm font-semibold text-[var(--muted)]"
            htmlFor="title"
          >
            Project title
          </label>
          <input
            id="title"
            name="title"
            className="input"
            defaultValue={initialValues.title}
            placeholder="Build a polished landing page for our SaaS beta"
          />
        </div>

        <div className="md:col-span-2">
          <label
            className="mb-2 block text-sm font-semibold text-[var(--muted)]"
            htmlFor="description"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            className="input min-h-40"
            defaultValue={initialValues.description}
            placeholder="Explain the scope, expected deliverables, and who would be a strong fit."
          />
        </div>

        <div>
          <label
            className="mb-2 block text-sm font-semibold text-[var(--muted)]"
            htmlFor="tech_stack"
          >
            Tech stack
          </label>
          <input
            id="tech_stack"
            name="tech_stack"
            className="input"
            defaultValue={initialValues.tech_stack}
            placeholder="next.js, tailwind, postgres"
          />
        </div>

        <div>
          <label
            className="mb-2 block text-sm font-semibold text-[var(--muted)]"
            htmlFor="budget"
          >
            Budget
          </label>
          <input
            id="budget"
            name="budget"
            type="number"
            min="0"
            className="input"
            defaultValue={initialValues.budget}
            placeholder="1500"
          />
        </div>

        <div>
          <label
            className="mb-2 block text-sm font-semibold text-[var(--muted)]"
            htmlFor="deadline"
          >
            Deadline
          </label>
          <input
            id="deadline"
            name="deadline"
            type="date"
            className="input"
            defaultValue={initialValues.deadline}
          />
        </div>

        <div>
          <label
            className="mb-2 block text-sm font-semibold text-[var(--muted)]"
            htmlFor="status"
          >
            Status
          </label>
          <select
            id="status"
            name="status"
            className="input"
            defaultValue={initialValues.status}
          >
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-2xl border border-[rgba(162,48,48,0.18)] bg-[rgba(162,48,48,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex justify-end">
        <button className="btn-primary" disabled={loading} type="submit">
          {loading
            ? mode === 'edit'
              ? 'Saving...'
              : 'Posting...'
            : mode === 'edit'
              ? 'Save changes'
              : 'Publish project'}
        </button>
      </div>
    </form>
  )
}
