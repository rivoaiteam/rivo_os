# Settings - User Guide

## What are Settings?
Settings let you configure the app - manage channels, sources, bank products, and user accounts.

---

## Channels & Sources

### What is a Channel?
A channel is where leads come from at the highest level (e.g., Performance Marketing, Partner Hub).

### What is a Source?
A source is a specific campaign or partner under a channel (e.g., Meta Ads, WhatsApp Campaign).

### What is a Sub-Source?
A sub-source is a specific campaign variation (e.g., Refinance_Jan26, Personal_loan_Feb26).

### What Can I Do?

#### Manage Channels
- **As a user, I can** see all channels
- **As a user, I can** create a new channel
- **As a user, I can** edit channel name
- **As a user, I can** delete a channel (if no leads are using it)

#### Manage Sources
- **As a user, I can** see all sources under each channel
- **As a user, I can** create a new source
- **As a user, I can** edit source name
- **As a user, I can** set SLA time (how fast leads should be contacted)
- **As a user, I can** delete a source

#### Manage Sub-Sources
- **As a user, I can** see all sub-sources under each source
- **As a user, I can** create a new sub-source
- **As a user, I can** edit sub-source name
- **As a user, I can** delete a sub-source

---

## Bank Products

### What is a Bank Product?
A bank product is a specific mortgage offering from a bank (e.g., "Emirates NBD - Fixed Rate 5 Years").

### What Can I Do?

- **As a user, I can** see all bank products
- **As a user, I can** filter by bank name
- **As a user, I can** filter by active/inactive status
- **As a user, I can** search products by name

#### Create Bank Product
- **As a user, I can** click "+" to add a new product
- **As a user, I can** enter product name
- **As a user, I can** select the bank
- **As a user, I can** set rate type (Fixed or Variable)
- **As a user, I can** enter interest rate
- **As a user, I can** enter max LTV (Loan to Value %)
- **As a user, I can** enter max DBR (Debt Burden Ratio %)
- **As a user, I can** enter minimum/maximum loan amounts
- **As a user, I can** mark as active or inactive

#### Edit Bank Product
- **As a user, I can** click on a product to edit
- **As a user, I can** update any field
- **As a user, I can** save or cancel

#### Deactivate Bank Product
- **As a user, I can** toggle the active status
- **As a user, I can** hide products that are no longer offered

---

## Rate Calculator Settings

### EIBOR Rate
- **As a user, I can** view the current EIBOR rate
- **As a user, I can** update the EIBOR rate when it changes
- **As a user, I can** see when it was last updated

---

## User Management

### What Can I Do?

- **As a user, I can** see all users in the system
- **As a user, I can** see their role and status

#### Create User (Admin only)
- **As a user, I can** add a new user
- **As a user, I can** set their email and password
- **As a user, I can** assign their role

#### Edit User (Admin only)
- **As a user, I can** update user details
- **As a user, I can** change their role
- **As a user, I can** activate or deactivate users

#### Roles
| Role | What they can do |
|------|------------------|
| **Admin** | Full access to everything |
| **Manager** | Access to all leads, clients, cases |
| **Agent** | Access to assigned leads and clients |

---

## Structure Overview

```
Channel (e.g., Performance Marketing)
  └── Source (e.g., Meta Ads)
        └── Sub-Source (e.g., Refinance_Jan26)
              └── Leads come from here
```

```
Bank (e.g., Emirates NBD)
  └── Bank Product (e.g., Fixed Rate 5 Years)
        └── Cases apply for these products
```

---

## Tips
1. Set up your channels and sources before leads start coming in
2. Keep bank products up to date with current rates
3. Update EIBOR rate monthly (or when it changes)
4. Deactivate old products instead of deleting them (for history)
5. Use meaningful names for sources (include campaign name and date)
