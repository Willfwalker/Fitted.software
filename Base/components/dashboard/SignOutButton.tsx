"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"

export function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center gap-2.5 text-[0.84rem] font-light text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-200 cursor-pointer"
    >
      <LogOut className="h-4 w-4" strokeWidth={1.8} />
      Sign out
    </button>
  )
}
