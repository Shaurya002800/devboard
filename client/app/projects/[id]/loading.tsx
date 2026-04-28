export default function LoadingProject() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_0.8fr]">
      <div className="panel animate-pulse rounded-[2rem] p-8">
        <div className="h-5 w-24 rounded-full bg-[var(--surface-strong)]" />
        <div className="mt-5 h-10 w-2/3 rounded-2xl bg-[var(--surface-strong)]" />
        <div className="mt-4 h-24 rounded-3xl bg-[var(--surface-strong)]" />
      </div>
      <div className="panel animate-pulse rounded-[2rem] p-8">
        <div className="h-8 w-40 rounded-2xl bg-[var(--surface-strong)]" />
        <div className="mt-4 h-32 rounded-3xl bg-[var(--surface-strong)]" />
      </div>
    </div>
  )
}
