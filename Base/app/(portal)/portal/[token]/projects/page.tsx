import { notFound } from "next/navigation"
import { getPortalByToken, getPortalProjects } from "@/lib/actions/portal-data"
import { PortalProjectBoard } from "@/components/portal/PortalProjectBoard"
import type { PortalPermissions } from "@/lib/types/portal"

export default async function PortalProjectsPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const { portal, error } = await getPortalByToken(token)

  if (error || !portal) return notFound()

  const perms = portal.permissions as PortalPermissions
  if (!perms.projects) return notFound()

  const { data: tasks } = await getPortalProjects(token)

  return (
    <div>
      <h2 className="font-[family-name:var(--font-display)] text-[1.3rem] text-[var(--text)] mb-6">
        Projects
      </h2>
      <PortalProjectBoard tasks={tasks as Record<string, unknown>[]} />
    </div>
  )
}
