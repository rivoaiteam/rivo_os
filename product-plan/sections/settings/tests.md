# Test Instructions: Settings

These test-writing instructions are **framework-agnostic**. Adapt them to your testing setup.

## Overview

Test the settings management functionality: navigation, channels CRUD, campaigns with status workflow, and users management.

---

## User Flow Tests

### Flow 1: Navigate Settings

**Scenario:** User navigates through settings sections

**Steps:**
1. User clicks Settings in sidebar
2. Settings hub displays categories
3. User clicks "Channels" card
4. Channels page displays
5. User clicks "Back to Dashboard"

**Expected Results:**
- [ ] Settings hub shows all categories (Sources, Team, etc.)
- [ ] Clicking card navigates to section
- [ ] Back button returns to main workspace
- [ ] Sidebar shows active section highlighted

### Flow 2: Add Channel

**Scenario:** User adds a new channel

**Steps:**
1. User navigates to Settings > Channels
2. User clicks "Add Channel"
3. User enters name: "New Partner"
4. User clicks "Save"

**Expected Results:**
- [ ] Modal/form opens for new channel
- [ ] Validation requires name
- [ ] New channel appears in table
- [ ] Channel status is "active"

### Flow 3: Change Campaign Status

**Scenario:** User changes campaign from Incubation to Live

**Steps:**
1. User navigates to Settings > Campaigns
2. User sees campaign with "Incubation" badge
3. User clicks status dropdown
4. User selects "Live"

**Expected Results:**
- [ ] Status dropdown shows options: Incubation, Live, Pause
- [ ] Badge color changes (amber → green)
- [ ] Status persists after refresh

### Flow 4: Manage Users

**Scenario:** User toggles user active/inactive

**Steps:**
1. User navigates to Settings > Users
2. User sees team members table
3. User toggles status for a user
4. User status changes to "Inactive"

**Expected Results:**
- [ ] Users table shows name, email, role, status
- [ ] Toggle/dropdown changes status
- [ ] Inactive users visually distinguished

---

## Empty State Tests

### No Channels

**Setup:**
- Channels array is empty (`[]`)

**Expected Results:**
- [ ] Shows empty state message
- [ ] Add button visible and functional

### No Campaigns

**Setup:**
- Campaigns array is empty (`[]`)

**Expected Results:**
- [ ] Shows empty state message
- [ ] Add button visible and functional

---

## Sample Test Data

```typescript
const mockChannels = [
  { id: "ch-1", name: "Partner DSA", status: "active" },
  { id: "ch-2", name: "RMA", status: "active" }
];

const mockCampaigns = [
  { id: "camp-1", name: "Dec_Refinance_v2", status: "live", createdAt: "2025-12-01" },
  { id: "camp-2", name: "Jan_Purchase", status: "incubation", createdAt: "2025-12-15" }
];

const mockUsers = [
  { id: "user-1", name: "John Agent", email: "john@rivo.com", role: "agent", status: "active" },
  { id: "user-2", name: "Sarah Manager", email: "sarah@rivo.com", role: "manager", status: "active" }
];
```