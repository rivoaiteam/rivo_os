# Milestone 3: Clients

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestone 1 (Foundation) and Milestone 2 (Leads) complete

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

Implement the Clients section — identity collection, eligibility calculator, and document management for verified prospects.

## Overview

Clients are verified prospects with confirmed intent. This section collects identity data, calculates eligibility from self-declared financials, and manages document collection. Client records are permanent and never deleted.

**Key Functionality:**
- View a table of clients with eligibility metrics and status
- Create new clients directly (for verified channels)
- Edit client identity and financial information
- Calculate eligibility (DBR, LTV, Max Loan, Eligible Banks)
- Manage document uploads (8 document types)
- Log calls and add notes
- Convert to Case, mark as Not Eligible, or Not Proceeding
- View client details in a side panel with Profile/Documents/WhatsApp/Activity tabs

## Recommended Approach: Test-Driven Development

See `product-plan/sections/clients/tests.md` for detailed test-writing instructions.

**TDD Workflow:**
1. Read `tests.md` and write failing tests for the key user flows
2. Implement the feature to make tests pass
3. Refactor while keeping tests green

## What to Implement

### Components

Copy the section components from `product-plan/sections/clients/components/`:

- `ClientsList.tsx` — Main table view with filtering and create mode
- `ClientSidePanel.tsx` — Side panel with client details

### Data Layer

The components expect these data shapes:

```typescript
interface Client {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  residencyStatus: 'citizen' | 'resident'
  dateOfBirth: string
  nationality: string
  employmentStatus: 'employed' | 'selfEmployed'
  monthlySalary: number
  monthlyLiabilities: number | null
  loanAmount: number | null
  estimatedPropertyValue: number | null
  eligibilityStatus: 'pending' | 'eligible' | 'notEligible'
  status?: 'active' | 'converted' | 'notProceeding' | 'notEligible'
  estimatedDBR: number | null
  estimatedLTV: number | null
  maxLoanAmount: number | null
  eligibleBanks: string[] | null
  source: { channel: Channel; campaign?: string }
  documents: Document[]
  callLogs: CallLog[]
  notes?: Note[]
  statusChanges?: StatusChange[]
}
```

### Callbacks

Wire up these user actions:

| Callback | Description |
|----------|-------------|
| `onSelectClient` | Open side panel for client |
| `onCloseSidePanel` | Close the side panel |
| `onUpdateClient` | Update client profile/financials |
| `onUploadDocument` | Upload a document |
| `onRequestDocuments` | Request docs via WhatsApp |
| `onLogCall` | Log a call with outcome |
| `onAddNote` | Add a note |
| `onCreateCase` | Convert client to case |
| `onMarkNotProceeding` | Mark as not proceeding |
| `onMarkNotEligible` | Mark as not eligible |
| `onCreateClient` | Create new client |
| `onToggleCreateMode` | Toggle create form |

### Empty States

- **No clients yet:** Show "No clients" message with Create button
- **No documents uploaded:** Show empty state in Documents tab

### Business Logic

- **Eligibility Calculation:**
  - DBR = (Monthly Liabilities / Monthly Salary) × 100
  - LTV = (Loan Amount / Property Value) × 100
  - DBR ≤ 50% is good (green), > 50% is warning (amber)
  - LTV ≤ 80% is good (green), > 80% is warning (amber)

- **Document Types:** Passport, Emirates ID, Visa, Salary Certificate, Payslips (6 months), Bank Statements (6 months), Credit Card Statement, Loan Statements

- **Channel Sources:**
  - Direct channels (for new client creation): AskRivo, Partner DSA, RMA
  - Campaign channels (via lead conversion): Meta, Google, WhatsApp, Email

## Files to Reference

- `product-plan/sections/clients/README.md` — Feature overview
- `product-plan/sections/clients/tests.md` — Test-writing instructions
- `product-plan/sections/clients/components/` — React components
- `product-plan/sections/clients/types.ts` — TypeScript interfaces
- `product-plan/sections/clients/sample-data.json` — Test data

## Expected User Flows

### Flow 1: Create a New Client

1. User clicks "Create" button
2. Side panel opens with create form
3. User fills in identity (First Name, Phone required)
4. User fills in financials
5. User selects source channel (AskRivo, Partner DSA, RMA)
6. User clicks "Create Client"
7. **Outcome:** New client appears in table, side panel shows client details

### Flow 2: Upload Documents

1. User clicks on a client row
2. User switches to Documents tab
3. User clicks "Upload" next to a document type
4. User selects file
5. **Outcome:** Document status changes from "missing" to "uploaded"

### Flow 3: Convert Client to Case

1. User opens client with eligible status
2. User clicks three-dots menu
3. User selects "Convert"
4. User adds optional notes
5. User clicks "Confirm"
6. **Outcome:** Client status changes to "converted", Case is created

## Done When

- [ ] Tests written for key user flows
- [ ] All tests pass
- [ ] Clients table renders with real data
- [ ] Eligibility metrics display with progress bars
- [ ] Create client form works
- [ ] Edit client profile works
- [ ] Document upload works
- [ ] Call logging and notes work
- [ ] Convert/Not Eligible/Not Proceeding actions work
- [ ] Empty states display properly
- [ ] Responsive on mobile