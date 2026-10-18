import Link from 'next/link'

export function EmptyState({
  title,
  description,
  ctaHref,
  ctaLabel,
}: {
  title: string
  description: string
  ctaHref?: string
  ctaLabel?: string
}) {
  return (
    <div className="obsidian-frame rounded-[2rem] border-dashed p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--line)] bg-[#f5eadb] text-xl text-[var(--brand-dark)]">
        +
      </div>
      <h3 className="mt-5 text-2xl font-semibold">{title}</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
        {description}
      </p>
      {ctaHref && ctaLabel ? (
        <Link href={ctaHref} className="btn-primary mt-6 inline-flex">
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  )
}
