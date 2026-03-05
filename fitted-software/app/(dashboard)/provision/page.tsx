import { ProvisionForm } from "@/components/provision-form"

export default function ProvisionPage() {
  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Provision New Client</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Create a new client instance with their own repo, database, and deployment.
        </p>
      </div>
      <ProvisionForm />
    </div>
  )
}
