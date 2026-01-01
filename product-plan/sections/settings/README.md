# Settings Section

## Status: ✅ Implemented

## Overview

Configuration area for managers. Provides access to source configuration (Channels, Sub-Sources) and team management (Users).

## User Flows

1. **Navigate Settings** — Browse settings categories
2. **Manage Channels** — Add, edit, delete channels
3. **Manage Campaigns** — CRUD with status workflow
4. **Manage Users** — Team member management

## Components

- `SettingsPage.tsx` — Settings hub with category cards
- `ChannelsPage.tsx` — Channels management table
- `CampaignsPage.tsx` — Campaigns management table
- `UsersPage.tsx` — Users management table
- `SettingsTableElements.tsx` — Shared table elements

## Layout

Uses `SettingsLayout` component from shell with:
- Back button to return to main workspace
- Sidebar with grouped sections
- Content area for section-specific UI

## Callback Props

### Channels
- `onAddChannel` — Add new channel
- `onEditChannel` — Edit channel name
- `onDeleteChannel` — Delete channel

### Campaigns
- `onAddCampaign` — Add new campaign
- `onEditCampaign` — Edit campaign name
- `onDeleteCampaign` — Delete campaign
- `onChangeStatus` — Change campaign status (Incubation → Live → Pause)

### Users
- `onAddUser` — Add new user
- `onEditUser` — Edit user details
- `onDeleteUser` — Delete user
- `onChangeStatus` — Toggle active/inactive

## Design Decisions

- Settings hub shows all categories as cards
- Each sub-section in dedicated sidebar
- Campaign status workflow: Incubation → Live → Pause
- User roles: Agent, Coordinator, Manager

## Implementation Notes

**Implemented:**
- `SettingsPage.tsx` — Settings hub with category cards
- `ChannelsPage.tsx` — Channels list with sub-source counts
- `ChannelDetailPage.tsx` — Sub-sources management per channel
- `UsersPage.tsx` — Team member management with role/status
- `SettingsTableElements.tsx` — Shared table components
- `SettingsLayout.tsx` — Layout with sidebar navigation

**Channels:** Fixed set of 6 channels (Meta, Google, WhatsApp, Email, AskRivo, Partner DSA)
- Each channel has trust level (trusted/untrusted)
- Sub-sources managed per channel
- Sub-sources have SLA minutes configuration

**Users:**
- Add/edit/delete users
- Toggle active/inactive status
- Roles: Agent, Coordinator, Manager

**Not Implemented:**
- `CampaignsPage.tsx` — Campaigns replaced by sub-sources per channel