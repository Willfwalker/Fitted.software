export type ChatRole = "user" | "assistant" | "status"
export type ChatJobStatus = "pending" | "running" | "complete" | "rejected" | "failed"

export interface ChatMessage {
  id: string
  org_id: string
  created_by: string
  role: ChatRole
  content: string
  job_id: string | null
  job_status: ChatJobStatus | null
  job_detail: Record<string, unknown> | null
  created_at: string
}

export type FeatureType =
  | "new-page"
  | "add-fields"
  | "ui-change"
  | "automation"
  | "report"
  | "integration"
  | "other"

export interface FeatureTypeOption {
  value: FeatureType
  label: string
  description: string
}

export const FEATURE_TYPES: FeatureTypeOption[] = [
  { value: "new-page", label: "New Page / View", description: "Add a new page or section to an existing module" },
  { value: "add-fields", label: "Add Fields", description: "Add new data fields to an existing module" },
  { value: "ui-change", label: "UI / Design Change", description: "Change how something looks or behaves" },
  { value: "automation", label: "Automation / Workflow", description: "Automate a process or add a trigger" },
  { value: "report", label: "Report / Chart", description: "Add new analytics or visualizations" },
  { value: "integration", label: "Integration", description: "Connect with an external service" },
  { value: "other", label: "Other", description: "Freeform description" },
]

export interface FeatureRequestDetails {
  // New Page
  pageName?: string
  dataToDisplay?: string
  userActions?: string
  // Add Fields
  fieldNames?: string
  fieldType?: string
  fieldRequired?: boolean
  // UI Change
  elementToChange?: string
  desiredLook?: string
  // Automation
  trigger?: string
  action?: string
  // Report
  dataToVisualize?: string
  chartType?: string
  // Integration
  serviceName?: string
  dataToSync?: string
  // Other
  description?: string
  // Extra details (all types)
  extraDetails?: string
}

export type FeatureDifficulty = "easy" | "medium" | "hard"

export interface DifficultyAssessment {
  difficulty: FeatureDifficulty
  reason: string
}

export interface FeatureRequest {
  featureType: FeatureType
  module: string | null
  details: FeatureRequestDetails
}
