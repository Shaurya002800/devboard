import { EmptyState } from '@/components/empty-state'
import { ProjectCard } from '@/components/project-card'
import { safeFetchProjects } from '@/lib/api'

export async function ProjectFeed({
  page,
  stack,
  budget,
}: {
  page: number
  stack: string
  budget: string
}) {
  const { data: response, error } = await safeFetchProjects(
    { page, stack, budget, limit: 6 },
    { cache: 'no-store' }
  )

  if (error || !response) {
    return (
      <EmptyState
        title="We couldn't load projects right now."
        description={
          error ||
          'Check that the Express API is running and that NEXT_PUBLIC_API_URL points to your backend.'
        }
        ctaHref="/projects/new"
        ctaLabel="Post a project anyway"
      />
    )
  }

  if (!response.data.length) {
    return (
      <EmptyState
        title="No projects yet. Be the first to post one."
        description="Try changing your filters, or create a fresh project listing to kick off the board."
        ctaHref="/projects/new"
        ctaLabel="Post a project"
      />
    )
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {response.data.map(
        (project: Parameters<typeof ProjectCard>[0]['project']) => (
          <ProjectCard key={project.id} project={project} />
        )
      )}
    </div>
  )
}
