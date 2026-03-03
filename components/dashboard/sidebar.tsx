"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Entity } from "@/lib/config/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const ICON_MAP: Record<string, LucideIcon> = {
  users: Users,
  "file-text": FileText,
  "bar-chart": BarChart3,
};

interface SidebarProps {
  entities: Entity[];
  orgName: string;
}

export function Sidebar({ entities, orgName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="flex h-full w-60 flex-col border-r border-[#2A2520] bg-[#0F0E0D]">
      {/* Logo */}
      <div className="flex h-14 items-center px-5">
        <Link
          href="/dashboard"
          className="text-xl font-normal text-[#E8E0D4] tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          fitted.
        </Link>
      </div>

      <Separator className="bg-[#2A2520]" />

      {/* Nav */}
      <ScrollArea className="flex-1 px-3 py-3">
        <div className="space-y-1">
          {/* Dashboard */}
          <NavItem
            href="/dashboard"
            icon={LayoutDashboard}
            label="Dashboard"
            active={pathname === "/dashboard"}
          />

          <Separator className="my-3 bg-[#2A2520]" />

          {/* Dynamic entity nav */}
          <p className="px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-[#5A534D]">
            Data
          </p>
          {entities.map((entity) => {
            const Icon = ICON_MAP[entity.icon] || FileText;
            const href = `/${entity.slug}`;
            return (
              <NavItem
                key={entity.id}
                href={href}
                icon={Icon}
                label={entity.display_name}
                active={pathname === href || pathname.startsWith(`${href}/`)}
              />
            );
          })}

          {/* Add entity placeholder */}
          <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-[#5A534D] hover:text-[#8A817A] transition-colors">
            <Plus className="h-3.5 w-3.5" />
            Add entity
          </button>
        </div>
      </ScrollArea>

      {/* Bottom section */}
      <div className="border-t border-[#2A2520] p-3 space-y-1">
        <NavItem
          href="/settings"
          icon={Settings}
          label="Settings"
          active={pathname === "/settings"}
        />
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-[#8A817A] hover:bg-[#1A1816] hover:text-[#E8E0D4] transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
        <p className="px-3 pt-1 text-[10px] text-[#5A534D] truncate">{orgName}</p>
      </div>
    </div>
  );
}

function NavItem({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
        active
          ? "bg-[#1A1816] text-[#E8E0D4]"
          : "text-[#8A817A] hover:bg-[#1A1816] hover:text-[#E8E0D4]"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}
