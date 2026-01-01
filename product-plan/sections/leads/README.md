# Leads Section

## Status: ✅ Implemented

## Overview

SLA-prioritized verification queue for raw signals from channels. Marketing Owner reviews leads, logs call outcomes, and either Drops or Converts to Client.

## User Flows

1. **Review Lead** — View lead details, check SLA countdown
2. **Log Call** — Record call outcome (Connected/No Answer) with notes
3. **Add Note** — Add a text note to lead activity
4. **Convert to Client** — Convert verified lead to client
5. **Drop Lead** — Mark unqualified lead as dropped

## Components

- `LeadsList.tsx` — Main table view with filtering and search
- `LeadSidePanel.tsx` — Side panel with Profile/WhatsApp/Activity tabs

## Callback Props

| Callback | Description |
|----------|-------------|
| `onSelectLead` | Open side panel for lead |
| `onCloseSidePanel` | Close the side panel |
| `onLogCall` | Log a call with outcome and optional notes |
| `onAddNote` | Add a note to the lead |
| `onDropLead` | Mark lead as dropped with reason |
| `onProceedToClient` | Convert lead to client |
| `onUpdateLead` | Update lead profile fields |
| `onFilterChange` | Handle filter changes (campaign) |

## Design Decisions

- SLA countdown shows urgency (24h from creation)
- New tab sorts oldest first (most urgent)
- Dropped/Converted leads appear dimmed with 50% opacity
- Campaign filter on right side of header
- Inline actions for quick note/call/convert without opening panel

## Implementation Notes

**Implemented:**
- `LeadsPage.tsx` — Main page with table, filtering, status tabs
- `LeadSidePanel.tsx` — Profile/WhatsApp/Activity tabs with actions
- Call logging with Connected/No Answer outcomes
- Note adding
- Convert to Client flow
- Drop lead with reason
- SLA countdown display
- Status filtering (New/Dropped/Converted)

**Call Outcomes:** Connected, No Answer