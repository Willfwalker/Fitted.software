import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEntities, getUserOrg } from "@/lib/entity/queries";
import { Sidebar } from "@/components/dashboard/sidebar";
import { AIPanel, AIFab } from "@/components/dashboard/ai-panel";
import { AIPanelProvider } from "@/components/dashboard/ai-panel-provider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const userOrg = await getUserOrg(supabase);

  if (!userOrg) {
    redirect("/login");
  }

  const entities = await getEntities(supabase, userOrg.orgId);

  return (
    <AIPanelProvider>
      <div className="flex h-screen bg-[#0B0B0B] overflow-hidden">
        <Sidebar entities={entities} orgName={userOrg.org.name} />
        <main className="flex-1 overflow-auto">{children}</main>
        <AIPanel />
        <AIFab />
      </div>
    </AIPanelProvider>
  );
}
