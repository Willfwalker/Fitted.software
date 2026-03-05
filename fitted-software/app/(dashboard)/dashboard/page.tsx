import { createServiceClient } from "@/lib/supabase/server"
import Link from "next/link"
import { DeleteClientButton } from "@/components/delete-client-button"

export default async function DashboardPage() {
  const supabase = createServiceClient()

  const { data: clients } = await supabase
    .from("provisioned_clients")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
        <Link
          href="/provision"
          className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          + Provision New
        </Link>
      </div>

      {!clients?.length ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-12 text-center">
          <p className="text-[var(--text-muted)] text-sm">No clients provisioned yet.</p>
          <Link
            href="/provision"
            className="inline-block mt-4 text-sm text-[var(--accent)] hover:underline"
          >
            Provision your first client
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] divide-y divide-[var(--border)]">
          {clients.map((client: Record<string, string>) => (
            <div key={client.id} className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text)]">{client.business_name}</p>
                <p className="text-xs text-[var(--text-dim)] mt-0.5">{client.slug}</p>
              </div>
              <div className="flex items-center gap-4">
                {client.vercel_url && (
                  <a
                    href={`https://${client.vercel_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[var(--accent)] hover:underline"
                  >
                    {client.vercel_url}
                  </a>
                )}
                <StatusBadge status={client.status} />
                {(client.status === "failed" || client.status === "rolled_back") && (
                  <DeleteClientButton slug={client.slug} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-yellow-900/30 text-yellow-400",
    provisioning: "bg-blue-900/30 text-blue-400",
    active: "bg-green-900/30 text-green-400",
    failed: "bg-red-900/30 text-red-400",
    rolled_back: "bg-gray-900/30 text-gray-400",
  }

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs ${colors[status] ?? colors.pending}`}>
      {status}
    </span>
  )
}
