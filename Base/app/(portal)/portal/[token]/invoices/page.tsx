import { notFound } from "next/navigation"
import { getPortalByToken, getPortalInvoices } from "@/lib/actions/portal-data"
import { PortalInvoiceList } from "@/components/portal/PortalInvoiceList"
import type { PortalPermissions } from "@/lib/types/portal"

export default async function PortalInvoicesPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const { portal, error } = await getPortalByToken(token)

  if (error || !portal) return notFound()

  const perms = portal.permissions as PortalPermissions
  if (!perms.invoices) return notFound()

  const { data: invoices } = await getPortalInvoices(token)

  return (
    <div>
      <h2 className="font-[family-name:var(--font-display)] text-[1.3rem] text-[var(--text)] mb-6">
        Invoices
      </h2>
      <PortalInvoiceList invoices={invoices as Record<string, unknown>[]} token={token} />
    </div>
  )
}
