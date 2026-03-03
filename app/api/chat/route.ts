import { streamText, tool, stepCountIs, convertToModelMessages, UIMessage } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getUserOrg } from "@/lib/entity/queries";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import {
  handleAddField,
  handleRemoveField,
  handleModifyView,
  handleCreateView,
  handleModifyLayout,
  handleChangeTheme,
  handleCreateEntity,
  handleUndoLastChange,
} from "@/lib/ai/tool-handlers";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages, context }: { messages: UIMessage[]; context?: { pathname?: string } } = await req.json();

  const supabase = await createClient();
  const userOrg = await getUserOrg(supabase);

  if (!userOrg) {
    return new Response("Unauthorized", { status: 401 });
  }

  const systemPrompt = await buildSystemPrompt(supabase, userOrg.orgId);

  const contextInfo = context?.pathname
    ? `\n\nThe user is currently on the page: ${context.pathname}`
    : "";

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: systemPrompt + contextInfo,
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    tools: {
      addField: tool({
        description: "Add a new field to an entity",
        inputSchema: z.object({
          entitySlug: z.string().describe("The slug of the entity (e.g., 'clients')"),
          fieldName: z.string().describe("The internal name of the field (snake_case)"),
          displayName: z.string().describe("The display name of the field"),
          fieldType: z.enum([
            "text", "textarea", "number", "email", "phone", "url",
            "select", "multi_select", "date", "datetime", "checkbox",
            "currency", "rating",
          ]).describe("The type of the field"),
          isRequired: z.boolean().optional().describe("Whether the field is required"),
          options: z.record(z.string(), z.unknown()).optional().describe("Field options (e.g., choices for select fields)"),
        }),
        execute: async (args) =>
          handleAddField(supabase, userOrg.orgId, userOrg.userId, args),
      }),

      removeField: tool({
        description: "Remove a field from an entity (cannot remove system fields)",
        inputSchema: z.object({
          entitySlug: z.string().describe("The slug of the entity"),
          fieldName: z.string().describe("The name of the field to remove"),
        }),
        execute: async (args) =>
          handleRemoveField(supabase, userOrg.orgId, userOrg.userId, args),
      }),

      modifyView: tool({
        description: "Modify an existing view's configuration (columns, sort, filters)",
        inputSchema: z.object({
          entitySlug: z.string().describe("The slug of the entity"),
          viewName: z.string().describe("The name of the view to modify"),
          config: z.record(z.string(), z.unknown()).describe("The configuration changes to apply"),
        }),
        execute: async (args) =>
          handleModifyView(supabase, userOrg.orgId, userOrg.userId, args),
      }),

      createView: tool({
        description: "Create a new view for an entity (table, board, calendar, or gallery)",
        inputSchema: z.object({
          entitySlug: z.string().describe("The slug of the entity"),
          name: z.string().describe("The name for the new view"),
          viewType: z.enum(["table", "board", "calendar", "gallery"]).describe("The type of view"),
          config: z.record(z.string(), z.unknown()).describe("The view configuration"),
        }),
        execute: async (args) =>
          handleCreateView(supabase, userOrg.orgId, userOrg.userId, args),
      }),

      modifyLayout: tool({
        description: "Modify the dashboard page layout by setting the full widget array",
        inputSchema: z.object({
          pageSlug: z.string().describe("The page slug (e.g., 'dashboard')"),
          layout: z.array(
            z.object({
              id: z.string(),
              type: z.string(),
              props: z.record(z.string(), z.unknown()),
              position: z.object({
                x: z.number(),
                y: z.number(),
                w: z.number(),
                h: z.number(),
              }),
            })
          ).describe("The full layout array of widgets"),
        }),
        execute: async (args) =>
          handleModifyLayout(supabase, userOrg.orgId, userOrg.userId, args),
      }),

      changeTheme: tool({
        description: "Change the theme/color variables (bg, accent, text, border, etc.)",
        inputSchema: z.object({
          variables: z.record(z.string(), z.string()).describe("CSS variable names and their new hex color values"),
        }),
        execute: async (args) =>
          handleChangeTheme(supabase, userOrg.orgId, userOrg.userId, args),
      }),

      createEntity: tool({
        description: "Create a new entity type with fields",
        inputSchema: z.object({
          name: z.string().describe("Internal name (lowercase, no spaces)"),
          displayName: z.string().describe("Display name for the entity"),
          slug: z.string().describe("URL slug for the entity"),
          icon: z.string().optional().describe("Lucide icon name"),
          description: z.string().optional().describe("Description of the entity"),
          fields: z.array(
            z.object({
              name: z.string().describe("Internal field name (snake_case)"),
              displayName: z.string().describe("Display name"),
              fieldType: z.string().describe("Field type"),
              isRequired: z.boolean().optional(),
              options: z.record(z.string(), z.unknown()).optional(),
            })
          ).describe("The fields to create for this entity"),
        }),
        execute: async (args) =>
          handleCreateEntity(supabase, userOrg.orgId, userOrg.userId, args),
      }),

      undoLastChange: tool({
        description: "Undo the most recent configuration change",
        inputSchema: z.object({}),
        execute: async () =>
          handleUndoLastChange(supabase, userOrg.orgId, userOrg.userId),
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
