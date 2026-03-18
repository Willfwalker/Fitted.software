"use client"

import { useState, useEffect, useCallback, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Users, Building2, Briefcase, FolderKanban, Paperclip, CalendarDays, MessageSquare, FileText, ClipboardList, Clock } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { globalSearch, type SearchResult } from "@/lib/actions/search"

const TYPE_CONFIG = {
  contact: { icon: Users, label: "Contacts", path: "/crm/contacts" },
  company: { icon: Building2, label: "Companies", path: "/crm/companies" },
  deal: { icon: Briefcase, label: "Deals", path: "/crm/deals" },
  task: { icon: FolderKanban, label: "Tasks", path: "/tasks" },
  file: { icon: Paperclip, label: "Files", path: "/files" },
  event: { icon: CalendarDays, label: "Events", path: "/calendar" },
  message: { icon: MessageSquare, label: "Messages", path: "/messages" },
  template: { icon: FileText, label: "Templates", path: "/messages/templates" },
  form: { icon: ClipboardList, label: "Forms", path: "/forms" },
  time_entry: { icon: Clock, label: "Time Entries", path: "/tasks" },
}

export function CommandKModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isPending, startTransition] = useTransition()

  // Cmd+K / Ctrl+K listener
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // Debounced search
  const doSearch = useCallback((q: string) => {
    if (q.trim().length < 2) {
      setResults([])
      return
    }
    startTransition(async () => {
      const res = await globalSearch(q)
      setResults(res.results)
    })
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 300)
    return () => clearTimeout(timer)
  }, [query, doSearch])

  const handleSelect = (result: SearchResult) => {
    const config = TYPE_CONFIG[result.type]
    router.push(`${config.path}/${result.id}`)
    setOpen(false)
    setQuery("")
    setResults([])
  }

  // Group results by type
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = []
    acc[r.type].push(r)
    return acc
  }, {})

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search contacts, companies, deals, tasks, files, events, messages, forms..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {query.length >= 2 && !isPending && results.length === 0 && (
          <CommandEmpty>No results found.</CommandEmpty>
        )}
        {isPending && query.length >= 2 && (
          <div className="py-6 text-center text-[0.82rem] text-[var(--text-dim)]">
            Searching...
          </div>
        )}
        {Object.entries(grouped).map(([type, items]) => {
          const config = TYPE_CONFIG[type as keyof typeof TYPE_CONFIG]
          const Icon = config.icon
          return (
            <CommandGroup key={type} heading={config.label}>
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`${item.type}-${item.id}-${item.title}`}
                  onSelect={() => handleSelect(item)}
                  className="cursor-pointer"
                >
                  <Icon className="mr-2 h-4 w-4 text-[var(--text-dim)]" />
                  <span className="text-[var(--text)]">{item.title}</span>
                  {item.subtitle && (
                    <span className="ml-2 text-[0.78rem] text-[var(--text-dim)]">{item.subtitle}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )
        })}
      </CommandList>
    </CommandDialog>
  )
}
