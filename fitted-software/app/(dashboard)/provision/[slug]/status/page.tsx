import { ProvisionStatus } from "@/components/provision-status"

export default async function StatusPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Provisioning</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Setting up <span className="text-[var(--text)]">{slug}</span>...
        </p>
      </div>
      <ProvisionStatus slug={slug} />
    </div>
  )
}
