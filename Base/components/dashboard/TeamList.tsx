import { UserPlus } from "lucide-react"

interface Member {
  id: string
  role: string
  user: {
    name: string | null
    email: string
    image: string | null
  }
}

export function TeamList({ members }: { members: Member[] }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
      {/* Header */}
      <div className="px-7 py-5 flex items-center justify-between border-b border-[var(--border)]">
        <h3 className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)]">
          Your Team
        </h3>
        <span className="text-[0.7rem] text-[var(--text-dim)] font-light">
          {members.length} {members.length === 1 ? "member" : "members"}
        </span>
      </div>

      {/* Members */}
      {members.length > 0 ? (
        <div>
          {members.map((m, i) => (
            <div
              key={m.id}
              className="px-7 py-4 flex items-center justify-between transition-colors duration-150 hover:bg-[rgba(232,224,212,0.02)]"
              style={i < members.length - 1 ? { borderBottom: "1px solid rgba(42,37,32,0.5)" } : undefined}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center text-[0.7rem] font-medium text-[var(--text-muted)]">
                  {(m.user.name?.[0] || m.user.email[0]).toUpperCase()}
                </div>
                <div>
                  <p className="text-[0.85rem] text-[var(--text)] font-light">
                    {m.user.name || m.user.email}
                  </p>
                  {m.user.name && (
                    <p className="text-[0.7rem] text-[var(--text-dim)] font-light mt-0.5">
                      {m.user.email}
                    </p>
                  )}
                </div>
              </div>
              <span className="text-[0.6rem] font-medium uppercase tracking-[0.14em] text-[var(--accent)] px-3 py-1 rounded-full bg-[rgba(212,115,78,0.06)]">
                {m.role}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-7 py-14 text-center">
          <div className="w-12 h-12 rounded-full border border-dashed border-[var(--border)] flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-5 h-5 text-[var(--text-dim)] opacity-50" strokeWidth={1.5} />
          </div>
          <p className="text-[0.82rem] text-[var(--text-dim)] font-light">No team members yet</p>
          <p className="text-[0.72rem] text-[var(--text-dim)] font-light mt-1.5 opacity-60">
            Invite collaborators from Settings
          </p>
        </div>
      )}
    </div>
  )
}
