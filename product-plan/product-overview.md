# Rivo OS — Product Overview

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

## Implementation Status

### WORKSPACE (Daily Work) — ✅ Complete

1. **Leads** ✅ — SLA-prioritized verification queue for raw signals from channels. Temporary records that convert to Clients or get dropped.
   - LeadsPage with table view, SLA timers, inline actions
   - LeadSidePanel with Profile/WhatsApp/Activity tabs
   - Call logging, notes, convert to client, drop lead
   - Consistent styling with Clients and Cases

2. **Clients** ✅ — Identity collection, eligibility calculator (DBR/LTV), and document management for verified prospects. Permanent records with inline communications and documents.
   - ClientsPage with table view and create mode, SLA timers
   - ClientSidePanel with Profile/Documents/WhatsApp/Activity tabs
   - Document upload with auto-detection, eligibility display, case creation
   - Consistent styling with Leads and Cases

3. **Cases** ✅ — Bank application workflow with deal details, form collection, and status tracking through to disbursement.
   - CasesPage with list view and kanban view (drag-and-drop between stages)
   - CaseSidePanel with Case/Documents/WhatsApp/Activity tabs
   - Bank icon with bank name displayed in list and kanban cards
   - Bank form upload, stage advancement, decline/withdraw
   - 10-stage pipeline: Processing → Disbursed

### TOOLBOX (Support Tools)

4. **WhatsApp** ⏳ — Planned but not yet implemented as standalone page. WhatsApp tabs exist in side panels.

5. **Bank Products** ✅ — Product catalog with rates, LTV limits, and forms.
   - BankProductsPage with table view
   - Add/edit bank products with rate details

### CONFIGURATION (Manager Only) — ✅ Complete

6. **Settings** ✅ — Configuration and admin area:
   - **Channels** ✅ — View/manage channels with sub-sources
   - **Channel Detail** ✅ — Manage sub-sources per channel
   - **Users** ✅ — Team member management
   - **Campaigns** ⏳ — Planned but uses sub-sources instead

## Data Model

**Entities:**
- Lead — Raw signal from a channel (unverified). Temporary record.
- Client — Verified person who wants a mortgage. Permanent record.
- Case — Specific bank application. Tracks through stages until terminal state.
- Document — File uploaded for a Client.
- CallLog — Record of a phone call with notes.
- Message — WhatsApp message (sent or received).
- Bank — Bank that offers mortgage products.
- Product — Mortgage product offered by a Bank.
- Channel — Source of leads (Partner DSA, RMA, AskRivo, Meta, Google, WhatsApp, Email).
- Campaign — Marketing campaign within a Channel.
- DropReason — Why a Lead, Client, or Case was dropped or closed.

## Design System

**Colors:**
- Primary: `blue` — Used for buttons, links, key accents
- Secondary: `amber` — Used for SLA warnings, alerts
- Neutral: `slate` — Used for backgrounds, text, borders

**Typography:**
- Heading: Inter
- Body: Inter
- Mono: JetBrains Mono

## Implementation Sequence

Build this product in milestones:

1. **Foundation** — Set up design tokens, data model types, and application shell
2. **Leads** — SLA-prioritized verification queue for lead processing
3. **Clients** — Identity, eligibility, and document management
4. **Cases** — Bank application workflow with 10-stage pipeline
5. **Settings** — Configuration area for channels, campaigns, and users

Each milestone has a dedicated instruction document in `product-plan/instructions/`.