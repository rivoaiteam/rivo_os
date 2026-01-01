# Milestone 4: Cases

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestone 1-3 complete (Foundation, Leads, Clients)

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

Implement the Cases section — bank application workflow with deal details, form collection, and status tracking through 10 stages.

## Overview

Cases are bank applications created from verified Clients. Each Case tracks through a 10-stage pipeline from Processing to Disbursement, with terminal exits for Declined or Withdrawn applications.

**Stage Pipeline:**
```
PROCESSING → SUBMITTED → UNDER_REVIEW → PRE_APPROVED → VALUATION → FOL_PROCESSING → FOL_RECEIVED → FOL_SIGNED → DISBURSED
                                    ↘                                                                        ↗
                                      → DECLINED / WITHDRAWN (terminal exits) ←──────────────────────────────
```

**Key Functionality:**
- View cases in List or Kanban view
- Filter by status (Active/All)
- Search by client name, bank, or case ID
- Create new cases from eligible clients
- Edit deal fields (11 mandatory fields)
- Manage bank forms (5 required forms)
- Log calls and add notes
- Advance through stages or mark as Declined/Withdrawn
- View case details in side panel with Deal/Documents/WhatsApp/Activity tabs

## Recommended Approach: Test-Driven Development

See `product-plan/sections/cases/tests.md` for detailed test-writing instructions.

## What to Implement

### Components

Copy the section components from `product-plan/sections/cases/components/`:

- `CasesList.tsx` — Main table view with view toggle and filtering
- `CasesKanban.tsx` — Kanban board view grouped by stage
- `CaseSidePanel.tsx` — Side panel with case details

### Data Layer

The components expect these data shapes:

```typescript
interface Case {
  id: string
  caseId: string  // Format: RV-XXXXX
  clientId: string

  // Deal fields (11 mandatory)
  caseType: 'residential' | 'commercial'
  serviceType: 'assisted' | 'fullyPackaged'
  applicationType: 'individual' | 'joint'
  bankSelection: string[]  // Bank IDs, max 3
  mortgageType: 'islamic' | 'conventional'
  emirate: Emirate
  loanAmount: number
  transactionType: TransactionType
  mortgageTerm: { years: number; months: number }
  estimatedPropertyValue: number
  propertyStatus: 'ready' | 'underConstruction'

  stage: CaseStage
  bankForms: BankForm[]
  callLogs: CallLog[]
  notes?: Note[]
  stageChanges?: StageChange[]
}
```

### Callbacks

Wire up these user actions:

| Callback | Description |
|----------|-------------|
| `onSelectCase` | Open side panel for case |
| `onCloseSidePanel` | Close the side panel |
| `onUpdateCase` | Update deal fields |
| `onUploadBankForm` | Upload a bank form |
| `onLogCall` | Log a call with outcome |
| `onAddNote` | Add a note |
| `onAdvanceStage` | Move to next stage |
| `onDecline` | Mark case as declined |
| `onWithdraw` | Mark case as withdrawn |
| `onCreateCase` | Create new case |
| `onToggleCreateMode` | Toggle create form |

### Empty States

- **No cases yet:** Show "No cases" message
- **No cases in kanban column:** Show "No cases" in column
- **No bank forms uploaded:** Show empty state in Documents tab

### Business Logic

- **Stage Gates:** Processing → Submitted requires all bank forms uploaded
- **Case ID Format:** RV-XXXXX (auto-generated)
- **Bank Selection:** Maximum 3 banks per case
- **Terminal States:** Disbursed, Declined, Withdrawn (no further actions)

**Bank Forms (5 required):**
1. Account Opening Form
2. FTS
3. KFS
4. Undertakings
5. Bank Checklist

## Files to Reference

- `product-plan/sections/cases/README.md` — Feature overview
- `product-plan/sections/cases/tests.md` — Test-writing instructions
- `product-plan/sections/cases/components/` — React components
- `product-plan/sections/cases/types.ts` — TypeScript interfaces
- `product-plan/sections/cases/sample-data.json` — Test data

## Expected User Flows

### Flow 1: Create a New Case

1. User clicks "Create" button
2. Side panel opens with create form
3. User searches and selects an eligible client
4. User fills in deal fields (all 11 required)
5. User clicks "Create Case"
6. **Outcome:** New case appears in Processing stage

### Flow 2: Advance Case Through Stages

1. User clicks on a case in Processing stage
2. User uploads all required bank forms
3. User clicks three-dots menu
4. User selects "Advance Stage"
5. User adds optional notes
6. User clicks "Confirm"
7. **Outcome:** Case moves to Submitted stage

### Flow 3: Use Kanban View

1. User clicks Kanban toggle button
2. Cases display as cards grouped by stage
3. User can see case count per stage
4. User clicks a card to open side panel
5. **Outcome:** Full case management from kanban view

### Flow 4: Decline a Case

1. User opens a case
2. User clicks three-dots menu
3. User selects "Decline"
4. User enters reason (required)
5. User clicks "Confirm"
6. **Outcome:** Case moves to Declined (terminal), row dimmed

## Done When

- [ ] Tests written for key user flows
- [ ] All tests pass
- [ ] Cases table renders with real data
- [ ] List/Kanban view toggle works
- [ ] Stage badges display correctly
- [ ] Create case form works with client selection
- [ ] Edit deal fields works
- [ ] Bank form upload works
- [ ] Stage advancement works with gates
- [ ] Decline/Withdraw actions work
- [ ] Call logging and notes work
- [ ] Empty states display properly
- [ ] Responsive on mobile