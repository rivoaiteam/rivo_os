# Test Instructions: Cases

These test-writing instructions are **framework-agnostic**. Adapt them to your testing setup.

## Overview

Test the case management functionality: creating cases, managing deal fields, uploading bank forms, advancing through stages, and terminal actions.

---

## User Flow Tests

### Flow 1: Create a New Case

**Scenario:** User creates a case from an eligible client

#### Success Path

**Steps:**
1. User clicks "Create" button
2. Side panel opens with create form
3. User searches and selects client "Sarah Johnson"
4. User fills in all 11 deal fields
5. User selects bank(s)
6. User clicks "Create Case"

**Expected Results:**
- [ ] Client search filters eligible clients only
- [ ] Create button disabled until all required fields filled
- [ ] New case appears in Processing stage
- [ ] Case ID generated (RV-XXXXX format)
- [ ] "Case Created" entry appears in Activity

### Flow 2: Upload Bank Forms

**Scenario:** User uploads required bank forms

**Steps:**
1. User opens case side panel
2. User switches to Documents tab
3. User clicks "Upload" next to Account Opening Form
4. User selects file
5. Repeat for all 5 forms

**Expected Results:**
- [ ] Form row shows checkmark (✓) when uploaded
- [ ] All 5 forms required for stage gate
- [ ] Missing forms block stage advancement

### Flow 3: Advance Stage

**Scenario:** User advances case from Processing to Submitted

**Steps:**
1. User opens case in Processing stage
2. User ensures all bank forms uploaded
3. User clicks three-dots menu
4. User selects "Advance Stage"
5. User adds optional notes
6. User clicks "Confirm"

**Expected Results:**
- [ ] Case stage changes to "submitted"
- [ ] Stage badge updates color/label
- [ ] "Stage: Submitted" entry in Activity
- [ ] In Kanban view, card moves to Submitted column

#### Failure Path: Missing Bank Forms

**Setup:**
- Case in Processing with incomplete bank forms

**Steps:**
1. User tries to advance stage

**Expected Results:**
- [ ] Error message or disabled action
- [ ] Indicates which forms are missing
- [ ] Stage does not advance

### Flow 4: Kanban View

**Scenario:** User switches to Kanban view

**Steps:**
1. User clicks Kanban toggle button (grid icon)
2. Cases display as cards in columns
3. User clicks a case card
4. Side panel opens

**Expected Results:**
- [ ] Cases grouped by stage in columns
- [ ] Each column shows stage label and count
- [ ] Active stages only (8 columns)
- [ ] Terminal cases visible in All tab only

### Flow 5: Decline Case

**Scenario:** Bank declines the application

**Steps:**
1. User opens case
2. User clicks three-dots menu
3. User selects "Decline"
4. User enters reason (required): "Credit score insufficient"
5. User clicks "Confirm"

**Expected Results:**
- [ ] Case stage changes to "declined"
- [ ] Red badge displayed
- [ ] "Declined" entry in Activity with reason
- [ ] Row dimmed (50% opacity)
- [ ] Three-dots menu hidden (terminal state)

---

## Empty State Tests

### No Cases Yet

**Setup:**
- Cases array is empty (`[]`)

**Expected Results:**
- [ ] Shows "No cases" message
- [ ] Create button visible
- [ ] Kanban view shows empty columns

### Empty Kanban Column

**Setup:**
- No cases in specific stage

**Expected Results:**
- [ ] Column shows "No cases" message
- [ ] Column header shows count of 0

---

## View Toggle Tests

### Switch Views

**Steps:**
1. Default is List view
2. User clicks Kanban icon
3. View switches to Kanban
4. User clicks List icon
5. View switches back to List

**Expected Results:**
- [ ] Active view button highlighted
- [ ] Data persists between view switches
- [ ] Selected case preserved if any

---

## Sample Test Data

```typescript
const mockCase = {
  id: "case-1",
  caseId: "RV-00123",
  clientId: "client-1",
  caseType: "residential",
  serviceType: "fullyPackaged",
  applicationType: "individual",
  bankSelection: ["bank-1", "bank-2"],
  mortgageType: "islamic",
  emirate: "dubai",
  loanAmount: 2000000,
  transactionType: "primaryPurchase",
  mortgageTerm: { years: 25, months: 0 },
  estimatedPropertyValue: 2500000,
  propertyStatus: "ready",
  stage: "processing",
  createdAt: new Date().toISOString(),
  bankForms: [
    { id: "bf-1", type: "accountOpeningForm", status: "missing" },
    { id: "bf-2", type: "fts", status: "missing" },
    { id: "bf-3", type: "kfs", status: "missing" },
    { id: "bf-4", type: "undertakings", status: "missing" },
    { id: "bf-5", type: "bankChecklist", status: "missing" }
  ],
  callLogs: [],
  notes: [],
  stageChanges: []
};

const mockClients = [
  { id: "client-1", firstName: "Sarah", lastName: "Johnson", phone: "+971551234567", estimatedDBR: 45, estimatedLTV: 80 }
];

const mockBanks = [
  { id: "bank-1", name: "ENBD" },
  { id: "bank-2", name: "ADCB" }
];
```