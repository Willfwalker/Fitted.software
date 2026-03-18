import { notFound } from "next/navigation"
import { getPortalByToken, getPortalFiles } from "@/lib/actions/portal-data"
import { PortalFileList } from "@/components/portal/PortalFileList"
import type { PortalPermissions } from "@/lib/types/portal"

export default async function PortalFilesPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const { portal, error } = await getPortalByToken(token)

  if (error || !portal) return notFound()

  const perms = portal.permissions as PortalPermissions
  if (!perms.files) return notFound()

  const { data: files } = await getPortalFiles(token)

  return (
    <div>
      <h2 className="font-[family-name:var(--font-display)] text-[1.3rem] text-[var(--text)] mb-6">
        Files
      </h2>
      <PortalFileList files={files as Record<string, unknown>[]} />
    </div>
  )
}
