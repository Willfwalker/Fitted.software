"use client"

interface ImportPreviewTableProps {
  headers: string[]
  rows: Record<string, string>[]
  errors: Record<number, Record<string, string>>
}

export function ImportPreviewTable({ headers, rows, errors }: ImportPreviewTableProps) {
  return (
    <div className="rounded-lg border border-[var(--border)] overflow-auto max-h-[300px]">
      <table className="w-full text-[0.82rem]">
        <thead className="sticky top-0 bg-[var(--bg-elevated)]">
          <tr>
            <th className="px-3 py-2 text-left text-[0.72rem] text-[var(--text-dim)] font-medium uppercase tracking-wider">#</th>
            {headers.map((h) => (
              <th key={h} className="px-3 py-2 text-left text-[0.72rem] text-[var(--text-dim)] font-medium uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-[rgba(42,37,32,0.3)]">
              <td className="px-3 py-2 text-[var(--text-dim)] font-light">{i + 1}</td>
              {headers.map((h) => {
                const hasError = errors[i]?.[h]
                return (
                  <td
                    key={h}
                    className={`px-3 py-2 font-light ${hasError ? "text-red-400" : "text-[var(--text-muted)]"}`}
                    title={hasError || undefined}
                  >
                    {row[h] || "—"}
                    {hasError && (
                      <span className="block text-[0.65rem] text-red-400">{hasError}</span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
