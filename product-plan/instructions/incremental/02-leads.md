# Milestone 2: Leads

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestone 1 (Foundation) complete

---

## About These Instructions

**What you're receiving:**
- Finished UI designs (React components with full styling)
- Data model definitions (TypeScript types and sample data)
- UI/UX specifications (user flows, requirements, screenshots)
- Design system tokens (colors, typography, spacing)
- Test-writing instructions for each section (for TDD approach)

**What you need to build:**
- Backend API endpoints and database schema
- Authentication and authorization
- Data fetching and state management
- Business logic and validation
- Integration of the provided UI components with real data

**Important guidelines:**
- **DO NOT** redesign or restyle the provided components — use them as-is
- **DO** wire up the callback props to your routing and API calls
- **DO** replace sample data with real data from your backend
- **DO** implement proper error handling and loading states
- **DO** implement empty states when no records exist (first-time users, after deletions)
- **DO** use test-driven development — write tests first using `tests.md` instructions
- The components are props-based and ready to integrate — focus on the backend and data layer

---

## Goal

Implement the Leads section — SLA-prioritized verification queue for raw signals from channels.

## Overview

Leads are raw signals from unverified channels (Meta, Google, WhatsApp, Email, AskRivo). Marketing Owner reviews leads, logs call outcomes, and either Drops or Converts to Client.

**Key Functionality:**
- View a table of leads with SLA countdown and status
- Filter by status (New/All) and campaign
- Search by name, phone, or email
- Log calls with outcomes (Connected/No Answer)
- Add notes to leads
- Convert leads to clients or drop them
- View lead details in a side panel with Profile/WhatsApp/Activity tabs

## Recommended Approach: Test-Driven Development

Before implementing this section, **write tests first** based on the test specifications provided.

See `product-plan/sections/leads/tests.md` for detailed test-writing instructions including:
- Key user flows to test (success and failure paths)
- Specific UI elements, button labels, and interactions to verify
- Expected behaviors and assertions

**TDD Workflow:**
1. Read `tests.md` and write failing tests for the key user flows
2. Implement the feature to make tests pass
3. Refactor while keeping tests green

## What to Implement

### Components

Copy the section components from `product-plan/sections/leads/components/`:

- `LeadsList.tsx` — Main table view with filtering and search
- `LeadSidePanel.tsx` — Side panel with lead details

### Data Layer

The components expect these data shapes:

```typescript
interface Lead {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone: string
  channel: Channel
  campaign?: string
  intent: string
  createdAt: string
  status: LeadStatus  // 'new' | 'dropped' | 'converted'
  callLogs: CallLog[]
  notes?: Note[]
  statusChanges?: StatusChange[]
}
```

You'll need to:
- Create API endpoints for CRUD operations
- Implement SLA countdown calculation (24h from createdAt)
- Track call logs, notes, and status changes

### Callbacks

Wire up these user actions:

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

### Empty States

Implement empty state UI for when no records exist:

- **No leads yet:** Show "No leads" message
- **No leads matching filter:** Show "No leads" with current filter

### Business Logic

- **SLA Calculation:** 24-hour SLA from `createdAt`. Show "Xh left" or "Overdue"
- **Status Flow:** Lead can only be new → dropped OR new → converted
- **Sort Order:** New tab shows oldest first (most urgent SLA), All tab shows newest first

## Files to Reference

- `product-plan/sections/leads/README.md` — Feature overview
- `product-plan/sections/leads/tests.md` — Test-writing instructions
- `product-plan/sections/leads/components/` — React components
- `product-plan/sections/leads/types.ts` — TypeScript interfaces
- `product-plan/sections/leads/sample-data.json` — Test data

## Expected User Flows

### Flow 1: Review and Convert a Lead

1. User sees leads table sorted by SLA urgency (oldest first)
2. User clicks on a lead row to open side panel
3. User reviews Profile tab information
4. User clicks phone icon to log a call
5. User selects "Connected" and adds notes
6. User clicks three-dots menu and selects "Convert"
7. **Outcome:** Lead status changes to "converted", appears dimmed in All tab

### Flow 2: Drop a Lead

1. User clicks three-dots menu on a lead row
2. User selects "Drop" option
3. User enters reason for dropping
4. User clicks "Confirm"
5. **Outcome:** Lead status changes to "dropped", appears dimmed in All tab

### Flow 3: Filter Leads by Campaign

1. User clicks Campaign filter dropdown
2. User selects a specific campaign
3. **Outcome:** Table shows only leads from that campaign

## Done When

- [ ] Tests written for key user flows
- [ ] All tests pass
- [ ] Leads table renders with real data
- [ ] SLA countdown displays correctly
- [ ] Search filters by name, phone, email
- [ ] Tab switching works (New/All)
- [ ] Campaign filter works
- [ ] Side panel opens on row click
- [ ] Call logging works with outcomes
- [ ] Note adding works
- [ ] Convert and Drop actions work
- [ ] Empty states display properly
- [ ] Responsive on mobile