export function ProjectGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="panel animate-pulse rounded-[1.75rem] p-5"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="h-4 w-24 rounded-full bg-[var(--surface-strong)]" />
          <div className="mt-4 h-8 w-3/4 rounded-2xl bg-[var(--surface-strong)]" />
          <div className="mt-4 h-20 rounded-3xl bg-[var(--surface-strong)]" />
          <div className="mt-5 flex gap-2">
            <div className="h-8 w-20 rounded-full bg-[var(--surface-strong)]" />
            <div className="h-8 w-20 rounded-full bg-[var(--surface-strong)]" />
          </div>
        </div>
      ))}
    </div>
  )
}
