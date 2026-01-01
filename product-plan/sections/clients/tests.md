# Test Instructions: Clients

These test-writing instructions are **framework-agnostic**. Adapt them to your testing setup.

## Overview

Test the clients management functionality: creating clients, editing profiles, calculating eligibility, uploading documents, and status transitions.

---

## User Flow Tests

### Flow 1: Create a New Client

**Scenario:** User creates a client directly (verified channel)

#### Success Path

**Steps:**
1. User clicks "Create" button
2. Side panel opens with create form
3. User enters First Name: "Sarah"
4. User enters Phone: "+971551234567"
5. User selects Channel: "Partner DSA"
6. User fills in financials (salary, liabilities, etc.)
7. User clicks "Create Client"

**Expected Results:**
- [ ] Create button disabled until required fields filled
- [ ] New client appears in table
- [ ] Side panel shows client details (not create form)
- [ ] Eligibility auto-calculated if financials provided
- [ ] "Client Created" entry appears in Activity

### Flow 2: Edit Client Profile

**Scenario:** User updates client financial information

**Steps:**
1. User clicks on client row
2. User clicks "Edit" button in Profile section
3. User updates Monthly Salary to 45000
4. User updates Loan Amount to 2000000
5. User clicks Save (checkmark)

**Expected Results:**
- [ ] Form fields become editable
- [ ] Save shows checkmark icon (emerald color)
- [ ] DBR and LTV recalculate automatically
- [ ] Eligibility status updates if thresholds crossed

### Flow 3: Upload Document

**Scenario:** User uploads a passport document

**Steps:**
1. User opens client side panel
2. User switches to Documents tab
3. User clicks "Upload" next to Passport
4. User selects file
5. Upload completes

**Expected Results:**
- [ ] Passport row shows checkmark (✓) instead of circle (○)
- [ ] Status changes from "missing" to "uploaded"
- [ ] Documents tab badge count decreases

### Flow 4: Convert Client to Case

**Scenario:** User converts eligible client to case

**Steps:**
1. User opens client with eligibilityStatus = "eligible"
2. User clicks three-dots menu
3. User selects "Convert"
4. User adds optional notes
5. User clicks "Confirm"

**Expected Results:**
- [ ] Client status changes to "converted"
- [ ] "Converted to Case" entry in Activity
- [ ] Client row dimmed (50% opacity)
- [ ] Case is created (separate flow)

---

## Empty State Tests

### No Clients Yet

**Setup:**
- Clients array is empty (`[]`)

**Expected Results:**
- [ ] Shows "No clients" message
- [ ] Create button is visible
- [ ] Clicking Create opens create form

### No Documents Uploaded

**Setup:**
- Client exists with all documents = "missing"

**Expected Results:**
- [ ] Documents tab shows 8 items with circle icons (○)
- [ ] Badge shows missing count
- [ ] Upload buttons visible for each

---

## Eligibility Calculation Tests

### DBR Calculation

**Setup:**
- Monthly Salary: 50000
- Monthly Liabilities: 20000

**Expected Results:**
- [ ] DBR = 40% (20000/50000 × 100)
- [ ] Progress bar shows green (≤50%)
- [ ] "40%" text displayed

### LTV Calculation

**Setup:**
- Loan Amount: 2000000
- Property Value: 2500000

**Expected Results:**
- [ ] LTV = 80% (2000000/2500000 × 100)
- [ ] Progress bar shows green (≤80%)

### Warning Thresholds

**Setup:**
- DBR > 50% OR LTV > 80%

**Expected Results:**
- [ ] Progress bar shows amber
- [ ] eligibilityStatus = "notEligible"

---

## Sample Test Data

```typescript
const mockClient = {
  id: "client-1",
  firstName: "Sarah",
  lastName: "Johnson",
  email: "sarah.j@example.com",
  phone: "+971551234567",
  residencyStatus: "resident",
  dateOfBirth: "1990-05-15",
  nationality: "British",
  employmentStatus: "employed",
  monthlySalary: 45000,
  monthlyLiabilities: 5000,
  loanAmount: 2000000,
  estimatedPropertyValue: 2500000,
  eligibilityStatus: "eligible",
  estimatedDBR: 45,
  estimatedLTV: 80,
  maxLoanAmount: 2250000,
  eligibleBanks: ["ENBD", "ADCB", "Mashreq"],
  createdAt: new Date().toISOString(),
  status: "active",
  source: { channel: "Meta", campaign: "Dec_Campaign" },
  documents: [
    { id: "doc-1", type: "passport", status: "uploaded" },
    { id: "doc-2", type: "emiratesId", status: "missing" }
  ],
  callLogs: [],
  notes: []
};
```