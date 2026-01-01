# Test Instructions: Leads

These test-writing instructions are **framework-agnostic**. Adapt them to your testing setup (Jest, Vitest, Playwright, Cypress, React Testing Library, etc.).

## Overview

Test the leads verification queue functionality: viewing leads, filtering, logging calls, adding notes, converting, and dropping leads.

---

## User Flow Tests

### Flow 1: View and Filter Leads

**Scenario:** User views leads table and filters by campaign

#### Success Path

**Setup:**
- Multiple leads exist with different campaigns and statuses

**Steps:**
1. User navigates to `/leads`
2. User sees leads table with columns: Lead, Source, Intent, Last Activity, Actions
3. User clicks "Campaign" filter dropdown
4. User selects a specific campaign
5. Table updates to show only matching leads

**Expected Results:**
- [ ] Table displays leads sorted by SLA urgency (oldest first in New tab)
- [ ] SLA countdown shows under each lead name (e.g., "18h left")
- [ ] Campaign filter shows selected campaign name
- [ ] Only leads matching selected campaign are visible

### Flow 2: Log a Call

**Scenario:** User logs a call with a lead

#### Success Path

**Setup:**
- Lead exists with status "new"
- Lead has phone number

**Steps:**
1. User clicks phone icon on lead row
2. Popover opens with "Connected" / "No Answer" toggle
3. User selects "Connected"
4. User enters notes: "Discussed requirements"
5. User clicks "Log Call"

**Expected Results:**
- [ ] Phone number copied to clipboard (checkmark shows briefly)
- [ ] Popover closes
- [ ] Side panel opens to Activity tab
- [ ] Activity shows "Connected" entry with notes and timestamp
- [ ] Last Activity column updates

#### Failure Path: No Phone Number

**Setup:**
- Lead exists without phone number

**Expected Results:**
- [ ] Phone action is disabled or shows appropriate message

### Flow 3: Convert Lead to Client

**Scenario:** User converts a qualified lead to a client

#### Success Path

**Setup:**
- Lead exists with status "new"

**Steps:**
1. User clicks three-dots menu on lead row
2. User selects "Convert" option
3. User enters optional notes: "Ready for onboarding"
4. User clicks "Confirm"

**Expected Results:**
- [ ] Lead status changes to "converted"
- [ ] Lead row appears dimmed (50% opacity)
- [ ] "Converted to Client" appears in Activity tab
- [ ] In "All" tab, lead shows "Converted" badge
- [ ] Lead no longer appears in "New" tab

### Flow 4: Drop a Lead

**Scenario:** User drops an unqualified lead

#### Success Path

**Setup:**
- Lead exists with status "new"

**Steps:**
1. User clicks three-dots menu on lead row
2. User selects "Drop" option
3. User enters reason: "Not interested"
4. User clicks "Confirm"

**Expected Results:**
- [ ] Lead status changes to "dropped"
- [ ] Lead row appears dimmed (50% opacity)
- [ ] "Dropped" appears in Activity tab with notes
- [ ] Lead no longer appears in "New" tab
- [ ] In "All" tab, lead shows "Dropped" badge

---

## Empty State Tests

### Primary Empty State

**Scenario:** User has no leads yet

**Setup:**
- Leads array is empty (`[]`)

**Expected Results:**
- [ ] Shows "No leads" message
- [ ] Table structure is still visible (headers)
- [ ] No broken layouts

### Filtered Empty State

**Scenario:** Filter returns no results

**Setup:**
- Leads exist but none match selected campaign

**Expected Results:**
- [ ] Shows "No leads" message
- [ ] Campaign filter shows selected value
- [ ] Clear indication that results are filtered

---

## Component Interaction Tests

### LeadsList

**Renders correctly:**
- [ ] Displays lead name "Ahmed Al Mansouri"
- [ ] Shows SLA countdown "18h left" for new leads
- [ ] Shows channel label "Meta" with campaign below

**User interactions:**
- [ ] Clicking row opens side panel
- [ ] Clicking checkbox selects row
- [ ] Bulk selection works with "Select All"

### LeadSidePanel

**Renders correctly:**
- [ ] Shows lead full name in header
- [ ] Tabs: Profile, WhatsApp, Activity
- [ ] Profile tab shows editable fields

**User interactions:**
- [ ] Edit button enables form inputs
- [ ] Save button saves changes
- [ ] Close button closes panel

---

## Edge Cases

- [ ] Handles very long lead names with truncation
- [ ] SLA "Overdue" displays in amber for expired leads
- [ ] Search filters by partial name, phone, email
- [ ] Tab counts update after status changes
- [ ] Converted/Dropped leads hide three-dots menu

---

## Sample Test Data

```typescript
const mockLead = {
  id: "lead-1",
  firstName: "Ahmed",
  lastName: "Al Mansouri",
  email: "ahmed@example.com",
  phone: "+971501234567",
  channel: "Meta",
  campaign: "Dec_Refinance_v2",
  intent: "Looking for mortgage refinancing",
  createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
  status: "new",
  callLogs: [],
  notes: [],
  statusChanges: []
};

const mockLeads = [mockLead];
const mockEmptyLeads = [];
```