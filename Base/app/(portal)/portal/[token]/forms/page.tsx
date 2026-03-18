import { notFound } from "next/navigation"
import { getPortalByToken, getPortalForms } from "@/lib/actions/portal-data"
import { PortalFormList } from "@/components/portal/PortalFormList"
import type { PortalPermissions } from "@/lib/types/portal"

export default async function PortalFormsPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const { portal, error } = await getPortalByToken(token)

  if (error || !portal) return notFound()

  const perms = portal.permissions as PortalPermissions
  if (!perms.forms) return notFound()

  const { data: submissions } = await getPortalForms(token)

  return (
    <div>
      <h2 className="font-[family-name:var(--font-display)] text-[1.3rem] text-[var(--text)] mb-6">
        Form Submissions
      </h2>
      <PortalFormList submissions={submissions as Record<string, unknown>[]} />
    </div>
  )
}
