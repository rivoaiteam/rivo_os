# Milestone 5: Settings

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestone 1-4 complete

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

Implement the Settings section — configuration area for channels, campaigns, and users management.

## Overview

Settings is a configuration hub for managers. It provides access to source configuration (Channels, Campaigns) and team management (Users).

**Key Functionality:**
- View settings categories with sub-sections
- Manage Channels (add, edit, delete)
- Manage Campaigns with status workflow (Incubation → Live → Pause)
- Manage Users (add, edit, delete)

## Recommended Approach: Test-Driven Development

See `product-plan/sections/settings/tests.md` for detailed test-writing instructions.

## What to Implement

### Components

Copy the section components from `product-plan/sections/settings/components/`:

- `SettingsPage.tsx` — Settings hub with category cards
- `ChannelsPage.tsx` — Channels management table
- `CampaignsPage.tsx` — Campaigns management table
- `UsersPage.tsx` — Users management table
- `SettingsTableElements.tsx` — Shared table elements

Also use the shell component:
- `SettingsLayout.tsx` — Settings sidebar layout

### Data Layer

```typescript
interface Channel {
  id: string
  name: string
  status: 'active'  // Always active
}

interface Campaign {
  id: string
  name: string
  status: 'incubation' | 'live' | 'pause'
  createdAt: string
}

interface User {
  id: string
  name: string
  email: string
  role: 'agent' | 'coordinator' | 'manager'
  status: 'active' | 'inactive'
}
```

### Callbacks

**Channels:**
- `onAddChannel` — Add new channel
- `onEditChannel` — Edit channel name
- `onDeleteChannel` — Delete channel

**Campaigns:**
- `onAddCampaign` — Add new campaign
- `onEditCampaign` — Edit campaign name
- `onDeleteCampaign` — Delete campaign
- `onChangeStatus` — Change campaign status

**Users:**
- `onAddUser` — Add new user
- `onEditUser` — Edit user details
- `onDeleteUser` — Delete user
- `onChangeStatus` — Toggle active/inactive

### Layout

Settings uses a dedicated sidebar layout:
- Back button to return to main workspace
- Sidebar with grouped sections (Sources, Rules, Team, etc.)
- Active section highlighted
- Content area for section-specific UI

## Files to Reference

- `product-plan/sections/settings/README.md` — Feature overview
- `product-plan/sections/settings/tests.md` — Test-writing instructions
- `product-plan/sections/settings/components/` — React components
- `product-plan/sections/settings/types.ts` — TypeScript interfaces
- `product-plan/sections/settings/sample-data.json` — Test data

## Expected User Flows

### Flow 1: Add a New Channel

1. User navigates to Settings
2. User clicks "Channels" in sidebar
3. User clicks "Add Channel" button
4. User enters channel name
5. User clicks "Save"
6. **Outcome:** New channel appears in table

### Flow 2: Change Campaign Status

1. User navigates to Settings > Campaigns
2. User sees campaigns with status badges
3. User clicks status dropdown on a campaign
4. User selects new status (Live, Pause)
5. **Outcome:** Campaign status updates, badge color changes

### Flow 3: Manage Users

1. User navigates to Settings > Users
2. User sees team members table
3. User can toggle user active/inactive
4. User can edit user details
5. **Outcome:** User management fully functional

## Done When

- [ ] Tests written for key user flows
- [ ] All tests pass
- [ ] Settings hub displays all categories
- [ ] Settings sidebar navigation works
- [ ] Channels CRUD works
- [ ] Campaigns CRUD works with status workflow
- [ ] Users CRUD works
- [ ] Back button returns to workspace
- [ ] Empty states for no items
- [ ] Responsive on mobile