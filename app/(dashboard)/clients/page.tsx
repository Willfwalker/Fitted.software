"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { EntityTable } from "@/components/entity/entity-table";
import { EntityForm } from "@/components/entity/entity-form";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Loader2 } from "lucide-react";
import type { Entity, EntityField, EntityRecord, View, ViewConfig } from "@/lib/config/types";

export default function ClientsPage() {
  const [loading, setLoading] = useState(true);
  const [entity, setEntity] = useState<Entity | null>(null);
  const [fields, setFields] = useState<EntityField[]>([]);
  const [records, setRecords] = useState<EntityRecord[]>([]);
  const [views, setViews] = useState<View[]>([]);
  const [activeViewId, setActiveViewId] = useState<string>("");
  const [orgId, setOrgId] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<EntityRecord | undefined>();

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Get org
    const { data: membership } = await supabase
      .from("organization_members")
      .select("org_id")
      .eq("user_id", user.id)
      .limit(1)
      .single();
    if (!membership) return;

    const currentOrgId = membership.org_id;
    setOrgId(currentOrgId);

    // Get entity
    const { data: entityData } = await supabase
      .from("entities")
      .select("*")
      .eq("org_id", currentOrgId)
      .eq("slug", "clients")
      .single();
    if (!entityData) return;
    setEntity(entityData as Entity);

    // Get fields
    const { data: fieldsData } = await supabase
      .from("entity_fields")
      .select("*")
      .eq("entity_id", entityData.id)
      .order("sort_order");
    setFields((fieldsData || []) as EntityField[]);

    // Get views
    const { data: viewsData } = await supabase
      .from("views")
      .select("*")
      .eq("entity_id", entityData.id)
      .order("sort_order");
    const loadedViews = (viewsData || []) as View[];
    setViews(loadedViews);

    if (loadedViews.length > 0 && !activeViewId) {
      const defaultView = loadedViews.find((v) => v.is_default) || loadedViews[0];
      setActiveViewId(defaultView.id);
    }

    // Get records
    const { data: recordsData } = await supabase
      .from("entity_records")
      .select("*")
      .eq("org_id", currentOrgId)
      .eq("entity_id", entityData.id)
      .order("created_at", { ascending: false });
    setRecords((recordsData || []) as EntityRecord[]);

    setLoading(false);
  }, [activeViewId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 text-[#8A817A] animate-spin" />
      </div>
    );
  }

  if (!entity) {
    return (
      <div className="flex items-center justify-center h-full text-[#5A534D]">
        Clients entity not found.
      </div>
    );
  }

  const activeView = views.find((v) => v.id === activeViewId);
  const viewConfig = activeView?.config as ViewConfig | undefined;
  const columns = viewConfig?.columns ?? fields.map((f) => f.name);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-normal text-[#E8E0D4]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Clients
          </h1>
          <p className="text-sm text-[#8A817A] mt-1">
            {records.length} {records.length === 1 ? "client" : "clients"}
          </p>
        </div>
        <Sheet open={sheetOpen} onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setEditingRecord(undefined);
        }}>
          <SheetTrigger asChild>
            <Button className="bg-[#D4734E] hover:bg-[#E8845D] text-[#0B0B0B] font-medium">
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </SheetTrigger>
          <SheetContent className="bg-[#0F0E0D] border-[#2A2520] w-[400px]">
            <SheetHeader>
              <SheetTitle className="text-[#E8E0D4]">
                {editingRecord ? "Edit Client" : "New Client"}
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <EntityForm
                fields={fields}
                entityId={entity.id}
                orgId={orgId}
                record={editingRecord}
                onSuccess={() => {
                  setSheetOpen(false);
                  setEditingRecord(undefined);
                  loadData();
                }}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* View Tabs */}
      {views.length > 1 && (
        <Tabs value={activeViewId} onValueChange={setActiveViewId}>
          <TabsList className="bg-[#131110] border border-[#2A2520]">
            {views.map((view) => (
              <TabsTrigger
                key={view.id}
                value={view.id}
                className="text-[#8A817A] data-[state=active]:text-[#E8E0D4] data-[state=active]:bg-[#1A1816]"
              >
                {view.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {/* Table */}
      <EntityTable
        fields={fields}
        records={records}
        columns={columns}
        entitySlug="clients"
      />
    </div>
  );
}
