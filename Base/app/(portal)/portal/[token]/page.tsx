import { notFound } from "next/navigation"
import { getPortalByToken, getPortalInvoices, getPortalProjects } from "@/lib/actions/portal-data"
import type { PortalPermissions } from "@/lib/types/portal"
import { FileText, FolderKanban, Receipt, ClipboardList } from "lucide-react"
import Link from "next/link"

export default async function PortalOverviewPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const { portal, orgName, error } = await getPortalByToken(token)

  if (error || !portal) return notFound()

  const permissions = portal.permissions as PortalPermissions
  const clientName = portal.contact
    ? `${portal.contact.first_name} ${portal.contact.last_name}`
    : portal.company?.name || "Client"

  // Fetch summary counts
  const [invoicesRes, projectsRes] = await Promise.all([
    permissions.invoices ? getPortalInvoices(token) : Promise.resolve({ data: [] }),
    permissions.projects ? getPortalProjects(token) : Promise.resolve({ data: [] }),
  ])

  const unpaidInvoices = (invoicesRes.data as { status: string }[]).filter(
    (i) => i.status !== "PAID"
  ).length

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-[1.5rem] text-[var(--text)] mb-1">
        Welcome, {clientName}
      </h1>
      <p className="text-[0.85rem] text-[var(--text-muted)] mb-8">
        {orgName} client portal
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {permissions.invoices && (
          <Link
            href={`/portal/${token}/invoices`}
            className="rounded-xl border border-[var(--border)] p-5 hover:border-[var(--accent)] transition-colors"
          >
            <Receipt className="h-5 w-5 text-[var(--accent)] mb-3" />
            <p className="text-[0.95rem] font-medium text-[var(--text)] mb-1">Invoices</p>
            <p className="text-[0.8rem] text-[var(--text-muted)]">
              {invoicesRes.data.length} invoice{invoicesRes.data.length !== 1 ? "s" : ""}
              {unpaidInvoices > 0 && ` · ${unpaidInvoices} unpaid`}
            </p>
          </Link>
        )}

        {permissions.projects && (
          <Link
            href={`/portal/${token}/projects`}
            className="rounded-xl border border-[var(--border)] p-5 hover:border-[var(--accent)] transition-colors"
          >
            <FolderKanban className="h-5 w-5 text-[var(--accent)] mb-3" />
            <p className="text-[0.95rem] font-medium text-[var(--text)] mb-1">Projects</p>
            <p className="text-[0.8rem] text-[var(--text-muted)]">
              {projectsRes.data.length} task{projectsRes.data.length !== 1 ? "s" : ""}
            </p>
          </Link>
        )}

        {permissions.files && (
          <Link
            href={`/portal/${token}/files`}
            className="rounded-xl border border-[var(--border)] p-5 hover:border-[var(--accent)] transition-colors"
          >
            <FileText className="h-5 w-5 text-[var(--accent)] mb-3" />
            <p className="text-[0.95rem] font-medium text-[var(--text)] mb-1">Files</p>
            <p className="text-[0.8rem] text-[var(--text-muted)]">View shared files</p>
          </Link>
        )}

        {permissions.forms && (
          <Link
            href={`/portal/${token}/forms`}
            className="rounded-xl border border-[var(--border)] p-5 hover:border-[var(--accent)] transition-colors"
          >
            <ClipboardList className="h-5 w-5 text-[var(--accent)] mb-3" />
            <p className="text-[0.95rem] font-medium text-[var(--text)] mb-1">Forms</p>
            <p className="text-[0.8rem] text-[var(--text-muted)]">View form submissions</p>
          </Link>
        )}
      </div>
    </div>
  )
}
