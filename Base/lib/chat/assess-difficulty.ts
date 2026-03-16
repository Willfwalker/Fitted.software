import type { FeatureRequest, DifficultyAssessment } from "@/lib/types/chat"

export function assessDifficulty(request: FeatureRequest): DifficultyAssessment {
  switch (request.featureType) {
    case "add-fields":
      return {
        difficulty: "easy",
        reason: "Adding fields to an existing module is a straightforward schema and UI update.",
      }

    case "ui-change":
      return {
        difficulty: "easy",
        reason: "Design and layout changes are localized to existing components with no new data logic.",

      }

    case "new-page":
      return {
        difficulty: "hard",
        reason: "New pages require database schema, server actions, routing, and full UI — this is a multi-layer change.",
      }

    case "automation":
      return {
        difficulty: "hard",
        reason: "Automations involve triggers, background logic, and careful integration with existing workflows.",
      }

    case "integration":
      return {
        difficulty: "hard",
        reason: "External integrations require API connections, authentication setup, and data mapping between systems.",
      }

    case "report":
      return {
        difficulty: "medium",
        reason: "Reports need data aggregation queries and chart components, but build on existing data.",
      }

    case "other":
      return {
        difficulty: "medium",
        reason: "Custom requests vary in scope — we'll analyze the details and get started.",
      }
  }
}
