import { getServerContext } from "@/lib/supabase/context"
import { FileBrowser } from "@/components/files/FileBrowser"
import type { FileRecord } from "@/lib/types/files"

export default async function FilesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const params = await searchParams
  const q = params.q
  const sort = params.sort
  const folder = params.folder || "/"
  const ctx = await getServerContext()
  if (!ctx) return null

  const { supabase, orgId } = ctx

  let orderColumn = "created_at"
  let ascending = false

  if (sort === "name") {
    orderColumn = "name"
    ascending = true
  } else if (sort === "size") {
    orderColumn = "size_bytes"
    ascending = false
  }

  let query = supabase
    .from("files")
    .select("*")
    .eq("org_id", orgId)
    .eq("folder", folder)

  if (q) {
    query = query.or(`name.ilike.%${q}%,original_name.ilike.%${q}%`)
  }

  query = query.order(orderColumn, { ascending })

  const { data: files } = await query

  // Get distinct folders for nav
  const { data: folderRows } = await supabase
    .from("files")
    .select("folder")
    .eq("org_id", orgId)
    .order("folder")

  const folders = folderRows
    ? [...new Set(folderRows.map((r) => r.folder))]
    : ["/"]

  return (
    <FileBrowser
      files={(files ?? []) as FileRecord[]}
      folders={folders}
      currentFolder={folder}
      searchQuery={q ?? ""}
      currentSort={sort ?? "recent"}
    />
  )
}
