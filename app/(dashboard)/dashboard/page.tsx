import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserOrg, getPage } from "@/lib/entity/queries";
import { PageRenderer } from "@/components/layout/page-renderer";
import type { WidgetConfig } from "@/lib/config/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const userOrg = await getUserOrg(supabase);

  if (!userOrg) redirect("/login");

  const page = await getPage(supabase, userOrg.orgId, "dashboard");

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1
          className="text-2xl font-normal text-[#E8E0D4]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Dashboard
        </h1>
        <p className="text-sm text-[#8A817A] mt-1">
          Welcome back to your workspace.
        </p>
      </div>

      <PageRenderer
        layout={(page?.layout ?? []) as WidgetConfig[]}
        orgId={userOrg.orgId}
      />
    </div>
  );
}
