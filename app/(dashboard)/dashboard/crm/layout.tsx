import { CRMNav } from "@/components/crm/CRMNav"

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-8 lg:p-12 max-w-[1400px] space-y-6">
      {/* Header */}
      <div className="animate-dash-in flex items-center justify-between" style={{ animationDelay: "0ms" }}>
        <div>
          <span className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-[var(--accent)] mb-2 block">
            CRM
          </span>
          <h1 className="font-[family-name:var(--font-display)] text-[2.2rem] text-[var(--text)] tracking-tight leading-tight">
            Relationships
          </h1>
        </div>
        <CRMNav />
      </div>
      <div className="animate-dash-in" style={{ animationDelay: "60ms" }}>
        {children}
      </div>
    </div>
  )
}
