import { Suspense } from 'react'
import Link from 'next/link'
import { PaginationControls } from '@/components/pagination-controls'
import { ProjectFeed } from '@/components/project-feed'
import { ProjectFilters } from '@/components/project-filters'
import { ProjectGridSkeleton } from '@/components/project-skeleton'

type HomeProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function Home({ searchParams }: HomeProps) {
  const params = searchParams ? await searchParams : {}
  const stack = typeof params.stack === 'string' ? params.stack : ''
  const budget = typeof params.budget === 'string' ? params.budget : ''
  const page =
    typeof params.page === 'string' ? Number.parseInt(params.page, 10) || 1 : 1

  return (
    <div className="flex flex-col gap-10">
      <section className="obsidian-frame fade-up relative overflow-hidden px-6 py-12 sm:px-10 lg:px-14 lg:py-16">
        <div
          aria-hidden="true"
          className="absolute -right-20 -top-28 h-80 w-80 rounded-full border-[32px] border-[#e9d9c1] opacity-50"
        />
        <div className="relative grid gap-10 lg:grid-cols-[1.4fr_0.8fr] lg:items-center">
          <div>
            <p className="eyebrow">A considered place for good work</p>
            <h1 className="mt-5 max-w-3xl text-5xl leading-[1.08] text-[var(--ink)] sm:text-6xl lg:text-7xl">
              Good projects deserve{' '}
              <span className="font-semibold not-italic text-[var(--accent)]">
                great people.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-[var(--muted)] sm:text-lg">
              A quieter way to find your next collaborator. Share a clear brief,
              discover thoughtful work, and connect with builders who can make
              it real.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#projects" className="btn-primary">
                Explore projects{' '}
                <span aria-hidden="true" className="ml-3">
                  ↗
                </span>
              </a>
              <Link href="/projects/new" className="btn-secondary">
                Post a project
              </Link>
            </div>
          </div>
          <div className="relative border-l-4 border-[var(--brand)] bg-[#eee0ca] p-7 sm:p-9">
            <p className="eyebrow">How it works</p>
            <ol className="mt-7 space-y-7">
              {[
                [
                  '01',
                  'Set the brief',
                  'Tell people what you are building and what matters.',
                ],
                [
                  '02',
                  'Meet the right fit',
                  'Get focused pitches from interested developers.',
                ],
                [
                  '03',
                  'Build together',
                  'Choose your collaborator and get moving.',
                ],
              ].map(([number, title, description]) => (
                <li
                  key={number}
                  className="flex gap-4 border-b border-[#cdb89b] pb-6 last:border-0 last:pb-0"
                >
                  <span className="font-semibold text-2xl text-[var(--accent)]">
                    {number}
                  </span>
                  <div>
                    <h2 className="text-xl">{title}</h2>
                    <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                      {description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section id="projects" className="scroll-mt-28 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Browse Projects</p>
            <h2 className="mt-2 text-4xl font-semibold">Explore the board</h2>
          </div>
          <p className="max-w-xl text-sm text-[var(--muted)]">
            Filter by stack or budget to narrow down projects that match your
            expertise and availability.
          </p>
        </div>

        <ProjectFilters initialStack={stack} initialBudget={budget} />

        <Suspense
          key={`${stack}-${budget}-${page}`}
          fallback={<ProjectGridSkeleton count={6} />}
        >
          <ProjectFeed page={page} stack={stack} budget={budget} />
        </Suspense>

        <PaginationControls page={page} stack={stack} budget={budget} />
      </section>
    </div>
  )
}
