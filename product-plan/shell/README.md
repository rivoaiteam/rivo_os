# Application Shell

## Overview

The shell provides the persistent navigation and layout that wraps all sections. It uses a top header bar combined with a collapsible sidebar.

## Components

### AppShell.tsx
Main layout wrapper that combines Header and Sidebar.

**Props:**
- `children` — Content to render in the main area
- `workspaceItems` — Navigation items for Workspace group
- `toolboxItems` — Navigation items for Toolbox group
- `user` — User info (name, avatarUrl)
- `showSettings` — Whether to show settings link
- `settingsActive` — Whether settings is currently active
- `onNavigate` — Navigation callback
- `onSettingsClick` — Settings click callback
- `onLogout` — Logout callback

### Header.tsx
Top header with logo and user menu.

### Sidebar.tsx
Collapsible navigation sidebar with Workspace and Toolbox groups.

### UserMenu.tsx
User avatar dropdown with logout option.

### SettingsLayout.tsx
Special layout for settings pages with secondary sidebar navigation.

### TopNav.tsx
Alternative horizontal navigation (if needed).

## Navigation Structure

| Group | Items |
|-------|-------|
| Workspace | Leads, Clients, Cases |
| Toolbox | WhatsApp, Bank Products |
| Footer | Settings |

## Responsive Behavior

- **Desktop:** Full sidebar (expanded or collapsed)
- **Tablet:** Collapsed sidebar (icons only)
- **Mobile:** Hidden sidebar, hamburger menu toggles overlay