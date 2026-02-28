import { createWorkspaceTools } from "./workspace"
import { createNavigationTools } from "./navigation"
import { createDataTools } from "./data"

export function createAllTools(orgId: string, userId: string) {
  return {
    ...createWorkspaceTools(orgId, userId),
    ...createNavigationTools(orgId, userId),
    ...createDataTools(orgId, userId),
  }
}
