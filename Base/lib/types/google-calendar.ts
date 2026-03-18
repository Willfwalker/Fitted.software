// ============================================
// Google Calendar API Response Types
// ============================================

export interface GoogleCalendarEvent {
  id: string
  summary: string
  description?: string
  location?: string
  start: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  end: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  status: string
  htmlLink: string
  updated: string
}

export interface GoogleCalendarList {
  kind: string
  items: GoogleCalendarEvent[]
  nextSyncToken?: string
  nextPageToken?: string
}
