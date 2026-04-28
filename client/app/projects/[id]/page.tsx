import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ApplyPanel } from '@/components/apply-panel'
import { fetchProject } from '@/lib/api'
import { formatStatusLabel, getStatusClassName } from '@/lib/status'

type ProjectPageProps = {
  params: Promise<{ id: string }>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params
  let project

  try {
    project = await fetchProject(id)
  } catch {
    notFound()
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.25fr_0.85fr]">
      <section className="obsidian-frame fade-up rounded-[2rem] p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`${getStatusClassName(project.status)} rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]`}
          >
            {formatStatusLabel(project.status)}
          </span>
          <span className="text-sm text-[var(--muted)]">
            Posted by {project.poster_name} • {project.applicant_count}{' '}
            applicants
          </span>
        </div>

        <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
          {project.title}
        </h1>
        <p className="mt-5 whitespace-pre-wrap text-base leading-7 text-[var(--muted)]">
          {project.description}
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <InfoCard
            label="Budget"
            value={project.budget ? `$${project.budget}` : 'Flexible'}
          />
          <InfoCard
            label="Deadline"
            value={
              project.deadline
                ? new Date(project.deadline).toLocaleDateString()
                : 'TBD'
            }
          />
        </div>

        <div className="mt-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
            Tech stack
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {project.tech_stack.map((item: string) => (
              <span
                key={item}
                className="obsidian-chip !text-[0.8rem] !normal-case"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <aside className="space-y-5">
        <ApplyPanel project={project} />

        <div className="obsidian-frame rounded-[2rem] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
            Need to post instead?
          </p>
          <h2 className="mt-3 text-2xl font-semibold">
            Start your own listing
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Create a scoped project brief with stack, budget, and deadline so
            applicants know what they are signing up for.
          </p>
          <Link
            href="/projects/new"
            className="btn-primary mt-5 inline-flex items-center"
          >
            Post a project
          </Link>
        </div>
      </aside>
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="obsidian-stat">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-3 text-lg font-semibold">{value}</p>
    </div>
  )
}
