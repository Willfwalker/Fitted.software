import { notFound } from "next/navigation"
import { getPortalByToken } from "@/lib/actions/portal-data"
import { PortalLayout } from "@/components/portal/PortalLayout"
import type { PortalPermissions } from "@/lib/types/portal"

export default async function PortalRootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const { portal, orgName, error } = await getPortalByToken(token)

  if (error || !portal) return notFound()

  const permissions = portal.permissions as PortalPermissions
  const clientName = portal.contact
    ? `${portal.contact.first_name} ${portal.contact.last_name}`
    : portal.company?.name || "Client"

  return (
    <PortalLayout
      orgName={orgName || "Company"}
      clientName={clientName}
      token={token}
      permissions={permissions}
    >
      {children}
    </PortalLayout>
  )
}
