# Cases Section

## Status: ✅ Implemented

## Overview

Bank application workflow with deal details, form collection, and status tracking through 10 stages. Cases track from Processing to Disbursement.

## Stage Pipeline

```
PROCESSING → SUBMITTED → UNDER_REVIEW → PRE_APPROVED → VALUATION → FOL_PROCESSING → FOL_RECEIVED → FOL_SIGNED → DISBURSED
                                    ↘                                                                        ↗
                                      → DECLINED / WITHDRAWN (terminal exits) ←──────────────────────────────
```

## User Flows

1. **Create Case** — Create from eligible client
2. **Edit Deal Fields** — Update 11 mandatory deal fields
3. **Upload Bank Forms** — Manage 5 required forms
4. **Advance Stage** — Progress through pipeline
5. **Decline/Withdraw** — Terminal exits

## Components

- `CasesList.tsx` — Main table view with view toggle and filtering
- `CasesKanban.tsx` — Kanban board view grouped by stage
- `CaseSidePanel.tsx` — Side panel with Deal/Documents/WhatsApp/Activity tabs

## Callback Props

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

## Design Decisions

- List/Kanban view toggle in header
- Kanban columns for active stages only
- Stage badges color-coded by type
- Bank forms required before first stage gate
- Terminal states (Disbursed/Declined/Withdrawn) dim rows

## Implementation Notes

**Implemented:**
- `CasesPage.tsx` — Main page with table view and filtering
- `CaseSidePanel.tsx` — Case/Documents/Activity tabs
- Create case from client with full deal form
- Edit deal fields (bank, rate, loan details)
- Bank form upload with 6 form types
- Bank form delete
- Stage advancement with notes
- Decline with optional reason
- Withdraw with optional reason
- Call logging with multiple outcomes
- Note adding
- Stage filtering (Active/Terminal/All)
- View case from client side panel
- Bank selection with rate configuration

**Stages:** Processing, Submitted, Under Review, Pre-Approved, Valuation, FOL Processing, FOL Received, FOL Signed, Disbursed, Declined, Withdrawn

**Bank Form Types:** Account Opening Form, FTS, KFS, Undertakings, Bank Checklist, Other

**Not Implemented:**
- Kanban view (CasesKanban.tsx) — planned but table-only for now