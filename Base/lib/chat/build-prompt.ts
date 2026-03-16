import type { FeatureRequest } from "@/lib/types/chat"

export function buildPrompt(request: FeatureRequest): string {
  const lines: string[] = []

  // Feature type
  const typeLabels: Record<string, string> = {
    "new-page": "New Page / View",
    "add-fields": "Add Fields",
    "ui-change": "UI / Design Change",
    automation: "Automation / Workflow",
    report: "Report / Chart",
    integration: "Integration",
    other: "Other",
  }
  lines.push(`Feature Type: ${typeLabels[request.featureType] || request.featureType}`)

  // Module
  if (request.module) {
    lines.push(`Module: ${request.module}`)
  }

  // Type-specific details
  const d = request.details
  switch (request.featureType) {
    case "new-page":
      if (d.pageName) lines.push(`Page Name: ${d.pageName}`)
      if (d.dataToDisplay) lines.push(`Data to Display: ${d.dataToDisplay}`)
      if (d.userActions) lines.push(`User Actions: ${d.userActions}`)
      break
    case "add-fields":
      if (d.fieldNames) lines.push(`Field Name(s): ${d.fieldNames}`)
      if (d.fieldType) lines.push(`Field Type: ${d.fieldType}`)
      lines.push(`Required: ${d.fieldRequired ? "Yes" : "No"}`)
      break
    case "ui-change":
      if (d.elementToChange) lines.push(`Element to Change: ${d.elementToChange}`)
      if (d.desiredLook) lines.push(`Desired Appearance: ${d.desiredLook}`)
      break
    case "automation":
      if (d.trigger) lines.push(`Trigger: ${d.trigger}`)
      if (d.action) lines.push(`Action: ${d.action}`)
      break
    case "report":
      if (d.dataToVisualize) lines.push(`Data to Visualize: ${d.dataToVisualize}`)
      if (d.chartType) lines.push(`Chart Type: ${d.chartType}`)
      break
    case "integration":
      if (d.serviceName) lines.push(`Service: ${d.serviceName}`)
      if (d.dataToSync) lines.push(`Data to Sync: ${d.dataToSync}`)
      break
    case "other":
      if (d.description) lines.push(`Description: ${d.description}`)
      break
  }

  // Extra details
  if (d.extraDetails) {
    lines.push(`Additional Context: ${d.extraDetails}`)
  }

  lines.push("")
  lines.push("Please implement this feature following the existing patterns in the codebase.")

  return lines.join("\n")
}
