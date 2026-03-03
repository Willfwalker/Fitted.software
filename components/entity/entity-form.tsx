"use client";

import { useState } from "react";
import type { EntityField, EntityRecord } from "@/lib/config/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface EntityFormProps {
  fields: EntityField[];
  entityId: string;
  orgId: string;
  record?: EntityRecord;
  onSuccess?: () => void;
}

export function EntityForm({
  fields,
  entityId,
  orgId,
  record,
  onSuccess,
}: EntityFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<Record<string, unknown>>(() => {
    if (record) return { ...record.data };
    const defaults: Record<string, unknown> = {};
    fields.forEach((f) => {
      if (f.field_type === "checkbox") defaults[f.name] = false;
      else defaults[f.name] = "";
    });
    return defaults;
  });

  function updateField(name: string, value: unknown) {
    setData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate required fields
    for (const field of fields) {
      if (field.is_required && !data[field.name]) {
        setError(`${field.display_name} is required`);
        setLoading(false);
        return;
      }
    }

    try {
      const supabase = createClient();

      if (record) {
        // Update
        const { error: err } = await supabase
          .from("entity_records")
          .update({ data })
          .eq("id", record.id);
        if (err) throw err;
      } else {
        // Create
        const { data: { user } } = await supabase.auth.getUser();
        const { error: err } = await supabase.from("entity_records").insert({
          org_id: orgId,
          entity_id: entityId,
          data,
          created_by: user?.id,
        });
        if (err) throw err;
      }

      router.refresh();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields
        .filter((f) => f.field_type !== "relation")
        .map((field) => (
          <div key={field.id} className="space-y-1.5">
            <label className="text-sm font-medium text-[#E8E0D4]">
              {field.display_name}
              {field.is_required && (
                <span className="text-[#D4734E] ml-1">*</span>
              )}
            </label>
            <FieldInput
              field={field}
              value={data[field.name]}
              onChange={(val) => updateField(field.name, val)}
            />
          </div>
        ))}

      {error && <p className="text-sm text-[#E87D5F]">{error}</p>}

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-[#D4734E] hover:bg-[#E8845D] text-[#0B0B0B] font-medium"
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {record ? "Update" : "Create"}
      </Button>
    </form>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: EntityField;
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  const inputClass =
    "bg-[#1A1816] border-[#2A2520] text-[#E8E0D4] placeholder:text-[#5A534D] focus-visible:ring-[#D4734E]";

  switch (field.field_type) {
    case "textarea":
      return (
        <Textarea
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${field.display_name.toLowerCase()}`}
          className={inputClass}
        />
      );

    case "select": {
      const choices = (field.options as { choices?: string[] })?.choices ?? [];
      return (
        <Select
          value={String(value ?? "")}
          onValueChange={(v) => onChange(v)}
        >
          <SelectTrigger className={inputClass}>
            <SelectValue placeholder={`Select ${field.display_name.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent className="bg-[#1A1816] border-[#2A2520]">
            {choices.map((choice) => (
              <SelectItem
                key={choice}
                value={choice}
                className="text-[#E8E0D4] focus:bg-[#2A2520] focus:text-[#E8E0D4]"
              >
                {choice}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    case "checkbox":
      return (
        <div className="flex items-center gap-2">
          <Checkbox
            checked={!!value}
            onCheckedChange={(checked) => onChange(!!checked)}
            className="border-[#2A2520] data-[state=checked]:bg-[#D4734E] data-[state=checked]:border-[#D4734E]"
          />
          <span className="text-sm text-[#8A817A]">
            {value ? "Yes" : "No"}
          </span>
        </div>
      );

    case "number":
    case "currency":
      return (
        <Input
          type="number"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")}
          placeholder={`Enter ${field.display_name.toLowerCase()}`}
          className={inputClass}
        />
      );

    case "date":
      return (
        <Input
          type="date"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      );

    case "datetime":
      return (
        <Input
          type="datetime-local"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      );

    case "email":
      return (
        <Input
          type="email"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${field.display_name.toLowerCase()}`}
          className={inputClass}
        />
      );

    case "url":
      return (
        <Input
          type="url"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          className={inputClass}
        />
      );

    case "phone":
      return (
        <Input
          type="tel"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${field.display_name.toLowerCase()}`}
          className={inputClass}
        />
      );

    default:
      return (
        <Input
          type="text"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${field.display_name.toLowerCase()}`}
          className={inputClass}
        />
      );
  }
}
