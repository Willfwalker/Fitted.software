"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export function DeleteClientButton({ slug }: { slug: string }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function handleDelete() {
    if (!confirm("Delete this failed client record?")) return
    setPending(true)
    const res = await fetch(`/api/provision/${slug}`, { method: "DELETE" })
    if (res.ok) {
      router.refresh()
    } else {
      setPending(false)
      alert("Failed to delete client")
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
    >
      {pending ? "Deleting..." : "Delete"}
    </button>
  )
}
