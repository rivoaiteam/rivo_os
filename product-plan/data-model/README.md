# Data Model

## Overview

Rivo OS uses a three-entity funnel model: Lead → Client → Case

## Core Entities

### Lead
A raw signal from a channel (unverified). Someone filled a form, clicked an ad, or was referred. Temporary — either converts to Client or gets dropped. Does not persist long-term.

### Client
A verified person who wants a mortgage. Permanent record containing identity information, self-declared financials, and documents. Can be created directly (for verified channels like Partner DSA or RMA) or converted from a Lead. Clients are never deleted — "not proceeding" means nurture, not trash.

### Case
A specific bank application for a specific bank, created from a Client. Contains deal details and bank forms. Tracks through stages until terminal state (Disbursed, Declined, or Withdrawn). One Client can have multiple Cases over time.

## Supporting Entities

### Document
A file uploaded for a Client (passport, Emirates ID, visa, salary certificate, payslips, bank statements, etc.). Documents persist at the Client level and are shared across Cases.

### CallLog
A record of a phone call with notes. Can be associated with a Lead, Client, or Case.

### Note
A text note added by an agent. Can be associated with a Lead, Client, or Case.

### Bank
A bank that offers mortgage products.

### Product
A mortgage product offered by a Bank, including rates, terms, and eligibility criteria.

### Channel
Source of leads. Fixed set: Partner DSA, RMA, AskRivo, Meta, Google, WhatsApp, Email. Each channel has an SLA (e.g., Partner DSA = 10 min, Meta = 4 hours).

### Campaign
A marketing campaign within a Channel. Has status: Incubation (initial) → Live → Paused. Tracks attribution through the funnel.

## Relationships

```
Lead ────────► Client ────────► Case
  │              │                │
  │              │                │
  ▼              ▼                ▼
CallLog       CallLog          CallLog
Note          Note             Note
              Document         BankForm

Channel ◄──── Lead
Campaign ◄─── Lead

Channel ◄──── Client (via source)
Campaign ◄─── Client (via source)

Bank ◄──────── Case
```

- Lead optionally converts to Client (one-to-one, not required)
- Client optionally originated from a Lead
- Client can be created directly without a Lead (for verified channels)
- Client has many Documents
- Client has many Cases (over time)
- Case belongs to one Client
- Case targets up to 3 Banks
- Channel has many Campaigns
- Lead belongs to a Channel and Campaign
- Client preserves Channel and Campaign from Lead (or direct entry)