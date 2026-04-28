import Link from 'next/link'
import { formatStatusLabel, getStatusClassName } from '@/lib/status'

type Project = {
  id: string
  title: string
  description: string
  tech_stack: string[]
  budget: number | null
  deadline: string | null
  poster_name: string
  applicant_count: number
  status: string
}

export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="obsidian-frame fade-up flex h-full flex-col rounded-[2rem] p-5 transition-transform duration-200 hover:-translate-y-1">
      <div className="flex items-center justify-between gap-3">
        <span
          className={`${getStatusClassName(project.status)} rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]`}
        >
          {formatStatusLabel(project.status)}
        </span>
        <span className="text-xs text-[var(--muted)]">
          {project.applicant_count} applicants
        </span>
      </div>

      <h3 className="mt-4 text-2xl font-semibold tracking-tight">
        {project.title}
      </h3>
      <p className="mt-3 line-clamp-4 text-sm leading-6 text-[var(--muted)]">
        {project.description}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {project.tech_stack.slice(0, 4).map((item) => (
          <span key={item} className="obsidian-chip">
            {item}
          </span>
        ))}
      </div>

      <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
            Budget
          </p>
          <p className="mt-1 font-semibold">
            {project.budget ? `$${project.budget}` : 'Flexible'}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
            Deadline
          </p>
          <p className="mt-1 font-semibold">
            {project.deadline
              ? new Date(project.deadline).toLocaleDateString()
              : 'TBD'}
          </p>
        </div>
      </div>

      <div className="obsidian-divider mt-6 flex items-center justify-between gap-3 border-t pt-4">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
            Posted by
          </p>
          <p className="mt-1 font-semibold">{project.poster_name}</p>
        </div>
        <Link
          href={`/projects/${project.id}`}
          className="btn-primary inline-flex items-center"
        >
          View project
        </Link>
      </div>
    </article>
  )
}
