import { CRMNav } from "@/components/crm/CRMNav"

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-8 lg:p-12 max-w-[1400px] space-y-6">
      <div className="animate-dash-in flex items-center justify-between" style={{ animationDelay: "0ms" }}>
        <CRMNav />
      </div>
      <div className="animate-dash-in" style={{ animationDelay: "60ms" }}>
        {children}
      </div>
    </div>
  )
}
