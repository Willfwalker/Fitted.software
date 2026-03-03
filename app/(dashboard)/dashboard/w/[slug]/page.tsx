import { redirect, notFound } from "next/navigation"
import { getServerContext } from "@/lib/supabase/context"
import { getWorkspacePageBySlug, getBlocksForPage } from "@/lib/workspace/queries"
import { WorkspacePage } from "@/components/workspace/WorkspacePage"
import * as LucideIcons from "lucide-react"

export default async function DynamicWorkspacePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const ctx = await getServerContext()
  if (!ctx) redirect("/login")

  const page = await getWorkspacePageBySlug(ctx.orgId, slug)
  if (!page) notFound()

  const blocks = await getBlocksForPage(page.id)

  const IconComp = (LucideIcons as Record<string, any>)[page.icon] || LucideIcons.LayoutDashboard

  return (
    <div className="p-8 lg:p-12 max-w-[1400px] space-y-8">
      {/* Page header */}
      <div className="animate-dash-in" style={{ animationDelay: "0ms" }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-[rgba(212,115,78,0.08)] flex items-center justify-center">
            <IconComp className="w-4.5 h-4.5 text-[var(--accent)]" strokeWidth={1.8} />
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-[2.2rem] text-[var(--text)] tracking-tight leading-tight">
            {page.title}
          </h1>
        </div>
        {page.description && (
          <p className="mt-1 text-[0.9rem] text-[var(--text-muted)] font-light pl-12">
            {page.description}
          </p>
        )}
      </div>

      {/* Blocks grid */}
      {blocks.length > 0 ? (
        <WorkspacePage page={page} blocks={blocks} orgId={ctx.orgId} />
      ) : (
        <div className="animate-dash-in rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] p-16 text-center" style={{ animationDelay: "60ms" }}>
          <p className="text-[1rem] text-[var(--text-muted)] font-light">
            This page is empty.
          </p>
          <p className="text-[0.82rem] text-[var(--text-dim)] font-light mt-2">
            Use the AI assistant to add blocks to this page.
          </p>
        </div>
      )}
    </div>
  )
}
