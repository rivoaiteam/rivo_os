# Rivo OS — Complete Implementation Instructions

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

## Test-Driven Development

Each section includes a `tests.md` file with detailed test-writing instructions. These are **framework-agnostic** — adapt them to your testing setup (Jest, Vitest, Playwright, Cypress, RSpec, Minitest, PHPUnit, etc.).

**For each section:**
1. Read `product-plan/sections/[section-id]/tests.md`
2. Write failing tests for key user flows (success and failure paths)
3. Implement the feature to make tests pass
4. Refactor while keeping tests green

The test instructions include:
- Specific UI elements, button labels, and interactions to verify
- Expected success and failure behaviors
- Empty state handling (when no records exist yet)
- Data assertions and state validations

---

# Product Overview

## Summary

Rivo OS is a Lead Operating System for mortgage brokerages that manages the conversion funnel from lead ingestion to bank disbursement. It treats the process as a funnel, not a pipeline - tracking drop-offs with reasons so "not now" clients can be won back later.

**Key Features:**
- Three-entity model: Lead → Client → Case
- Six-channel ingestion with verified/unverified routing
- Upfront eligibility calculator (DBR, LTV, Max Loan)
- SLA-based priority queue
- Call logging with notes
- WhatsApp integration for document capture and messaging
- Validation gates at each conversion step
- Real-time case status tracking
- Drop-off tracking with nurture triggers
- Multi-case support per client

## Sections

1. **Leads** — SLA-prioritized verification queue
2. **Clients** — Identity, eligibility, and document management
3. **Cases** — Bank application workflow with 10-stage pipeline
4. **Settings** — Configuration for channels, campaigns, users

---

# Milestone 1: Foundation

## Goal

Set up the foundational elements: design tokens, data model types, routing structure, and application shell.

## What to Implement

### 1. Design Tokens

**Color Palette:**
- Primary: `blue` — Buttons, links, active states
- Secondary: `amber` — SLA warnings, alerts, highlights
- Neutral: `slate` — Backgrounds, text, borders

**Typography:**
- Heading & Body: Inter
- Monospace: JetBrains Mono (for IDs, technical data)

### 2. Data Model Types

**Key Entities:**
- Lead, Client, Case (main workflow entities)
- Document, CallLog, Note (activity tracking)
- Bank, Product (catalog)
- Channel, Campaign (source tracking)

### 3. Routing Structure

| Route | Section |
|-------|---------|
| `/leads` | Leads workspace |
| `/clients` | Clients workspace |
| `/cases` | Cases workspace |
| `/whatsapp` | WhatsApp toolbox |
| `/bank-products` | Bank Products toolbox |
| `/settings` | Settings hub |
| `/settings/channels` | Channels configuration |
| `/settings/campaigns` | Campaigns configuration |
| `/settings/users` | Users management |

### 4. Application Shell

Components to use:
- `AppShell.tsx` — Main layout wrapper with sidebar
- `Header.tsx` — Top header with logo and user menu
- `Sidebar.tsx` — Collapsible navigation sidebar
- `UserMenu.tsx` — User avatar dropdown
- `SettingsLayout.tsx` — Settings page sidebar layout

**Navigation Structure:**

| Group | Items |
|-------|-------|
| Workspace | Leads, Clients, Cases |
| Toolbox | WhatsApp, Bank Products |
| Footer | Settings |

---

# Milestone 2: Leads

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
- View lead details in side panel with Profile/WhatsApp/Activity tabs

## Components

- `LeadsList.tsx` — Main table view with filtering and search
- `LeadSidePanel.tsx` — Side panel with lead details

## Data Shape

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
  status: 'new' | 'dropped' | 'converted'
  callLogs: CallLog[]
  notes?: Note[]
  statusChanges?: StatusChange[]
}
```

## Business Logic

- **SLA Calculation:** 24-hour SLA from `createdAt`. Show "Xh left" or "Overdue"
- **Status Flow:** Lead can only be new → dropped OR new → converted
- **Sort Order:** New tab shows oldest first (most urgent SLA), All tab shows newest first

---

# Milestone 3: Clients

## Goal

Implement the Clients section — identity collection, eligibility calculator, and document management.

## Overview

Clients are verified prospects with confirmed intent. This section collects identity data, calculates eligibility from self-declared financials, and manages document collection.

**Key Functionality:**
- View a table of clients with eligibility metrics and status
- Create new clients directly (for verified channels)
- Edit client identity and financial information
- Calculate eligibility (DBR, LTV, Max Loan, Eligible Banks)
- Manage document uploads (8 document types)
- Log calls and add notes
- Convert to Case, mark as Not Eligible, or Not Proceeding

## Components

- `ClientsList.tsx` — Main table view with filtering and create mode
- `ClientSidePanel.tsx` — Side panel with client details

## Data Shape

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

## Business Logic

- **Eligibility Calculation:**
  - DBR = (Monthly Liabilities / Monthly Salary) × 100
  - LTV = (Loan Amount / Property Value) × 100
  - DBR ≤ 50% is good (green), > 50% is warning (amber)
  - LTV ≤ 80% is good (green), > 80% is warning (amber)

- **Document Types:** Passport, Emirates ID, Visa, Salary Certificate, Payslips (6 months), Bank Statements (6 months), Credit Card Statement, Loan Statements

- **Channel Sources:**
  - Direct channels (for new client creation): AskRivo, Partner DSA, RMA
  - Campaign channels (via lead conversion): Meta, Google, WhatsApp, Email

---

# Milestone 4: Cases

## Goal

Implement the Cases section — bank application workflow with 10-stage pipeline.

## Overview

Cases are bank applications created from verified Clients. Each Case tracks through a 10-stage pipeline from Processing to Disbursement.

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
- Advance through stages or mark as Declined/Withdrawn

## Components

- `CasesList.tsx` — Main table view with view toggle and filtering
- `CasesKanban.tsx` — Kanban board view grouped by stage
- `CaseSidePanel.tsx` — Side panel with case details

## Data Shape

```typescript
interface Case {
  id: string
  caseId: string  // Format: RV-XXXXX
  clientId: string
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

## Business Logic

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

---

# Milestone 5: Settings

## Goal

Implement the Settings section — configuration area for channels, campaigns, and users.

## Overview

Settings is a configuration hub for managers. It provides access to source configuration (Channels, Campaigns) and team management (Users).

**Key Functionality:**
- View settings categories with sub-sections
- Manage Channels (add, edit, delete)
- Manage Campaigns with status workflow (Incubation → Live → Pause)
- Manage Users (add, edit, delete)

## Components

- `SettingsPage.tsx` — Settings hub with category cards
- `ChannelsPage.tsx` — Channels management table
- `CampaignsPage.tsx` — Campaigns management table
- `UsersPage.tsx` — Users management table
- `SettingsLayout.tsx` — Settings sidebar layout

## Data Shape

```typescript
interface Channel {
  id: string
  name: string
  status: 'active'
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

---

# Files Reference

| Category | Location |
|----------|----------|
| Product Overview | `product-plan/product-overview.md` |
| Design System | `product-plan/design-system/` |
| Data Model | `product-plan/data-model/` |
| Shell Components | `product-plan/shell/components/` |
| Section Components | `product-plan/sections/[section]/components/` |
| Section Types | `product-plan/sections/[section]/types.ts` |
| Sample Data | `product-plan/sections/[section]/sample-data.json` |
| Test Instructions | `product-plan/sections/[section]/tests.md` |