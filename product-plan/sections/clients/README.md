# Clients Section

## Status: ✅ Implemented

## Overview

Identity collection, eligibility calculator, and document management for verified prospects. Clients are permanent records that never get deleted.

## User Flows

1. **Create Client** — Create new client directly (verified channels)
2. **Edit Profile** — Update identity and financial information
3. **Calculate Eligibility** — Auto-calculate DBR, LTV, Max Loan
4. **Upload Documents** — Manage 8 document types
5. **Convert to Case** — Create bank application from eligible client
6. **Mark Not Proceeding** — Client chose not to continue
7. **Mark Not Eligible** — Client doesn't meet criteria

## Components

- `ClientsList.tsx` — Main table view with filtering and create mode
- `ClientSidePanel.tsx` — Side panel with Profile/Documents/WhatsApp/Activity tabs

## Callback Props

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

## Design Decisions

- Eligibility metrics (DBR, LTV) shown with progress bars
- Green for good (≤50% DBR, ≤80% LTV), amber for warning
- Documents tab shows checklist with upload buttons
- Source channels for direct creation: AskRivo, Partner DSA, RMA

## Implementation Notes

**Implemented:**
- `ClientsPage.tsx` — Main page with table, filtering, create panel
- `ClientSidePanel.tsx` — Profile/Documents/Activity tabs
- Create client with full profile form
- Edit client profile (inline editing)
- Document upload with 8 document types
- Document delete
- Eligibility display (DBR, LTV, Max Loan)
- Call logging with Connected/No Answer outcomes
- Note adding
- Create case from client
- Mark as Not Proceeding/Not Eligible
- Status filtering (Active/Not Proceeding/Not Eligible)
- Source/campaign filtering
- Cases dropdown for clients with multiple cases

**Document Types:** Passport, Emirates ID, Visa, Salary Certificate, Payslips, Bank Statements, Credit Card Statement, Loan Statements, Other