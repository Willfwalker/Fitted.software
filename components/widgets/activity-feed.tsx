import { createClient } from "@/lib/supabase/server";

interface ActivityFeedProps {
  title: string;
  limit?: number;
  orgId: string;
}

export async function ActivityFeed({ title, limit = 10, orgId }: ActivityFeedProps) {
  const supabase = await createClient();

  const { data: records } = await supabase
    .from("entity_records")
    .select("id, data, created_at, entity_id, entities(display_name)")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit);

  const items = records ?? [];

  return (
    <div className="rounded-lg border border-[#2A2520] bg-[#1A1816] p-5">
      <p className="text-xs font-medium text-[#8A817A] mb-4">{title}</p>
      {items.length === 0 ? (
        <p className="text-sm text-[#5A534D]">No activity yet.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const name = (item.data as Record<string, unknown>)?.name ?? "Record";
            const entityName = (item.entities as unknown as { display_name: string })?.display_name ?? "Unknown";
            const time = getRelativeTime(item.created_at);
            return (
              <div key={item.id} className="flex items-center gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-[#D4734E] flex-shrink-0" />
                <p className="text-sm text-[#E8E0D4] flex-1 truncate">
                  <span className="text-[#8A817A]">{entityName}:</span> {String(name)}
                </p>
                <span className="text-xs text-[#5A534D] flex-shrink-0">{time}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
