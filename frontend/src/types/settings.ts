/**
  * Settings Types - matches database schema
 */

// System Settings
export interface SystemSettings {
  systemPassword: string
  updatedAt?: string
}

// Fixed Channel IDs - matches channel.id in database
export type FixedChannelType =
  | 'perf_marketing'
  | 'partner_hub'
  | 'freelance'
  | 'bh_mortgage'
  | 'askrivo'

export type TrustLevel = 'trusted' | 'untrusted'

// Fixed channel configuration - matches channel table
export interface FixedChannel {
  id: FixedChannelType
  name: string
  description: string
  trustLevel: TrustLevel
  // UI config
  sourceLabel: string      // What to call sources (Platform, Partner, etc.)
  subSourceLabel?: string  // What to call sub-sources (Campaign, Agent, etc.)
  hasSubSources: boolean
}

// Fixed channels data - matches INSERT statements
export const FIXED_CHANNELS: FixedChannel[] = [
  {
    id: 'perf_marketing',
    name: 'Performance Marketing',
    description: 'Paid advertising campaigns',
    trustLevel: 'untrusted',
    sourceLabel: 'Source',
    subSourceLabel: 'Sub-source',
    hasSubSources: true,
  },
  {
    id: 'partner_hub',
    name: 'Partner Hub',
    description: 'Partner referral network',
    trustLevel: 'trusted',
    sourceLabel: 'Source',
    subSourceLabel: 'Sub-source',
    hasSubSources: true,
  },
  {
    id: 'freelance',
    name: 'Freelance Network',
    description: 'Freelance agent referrals',
    trustLevel: 'trusted',
    sourceLabel: 'Source',
    subSourceLabel: 'Sub-source',
    hasSubSources: true,
  },
  {
    id: 'bh_mortgage',
    name: 'BH Mortgage Team',
    description: 'Internal mortgage team',
    trustLevel: 'trusted',
    sourceLabel: 'Source',
    subSourceLabel: 'Sub-source',
    hasSubSources: true,
  },
  {
    id: 'askrivo',
    name: 'AskRivo',
    description: 'Direct AskRivo inquiries',
    trustLevel: 'trusted',
    sourceLabel: 'Source',
    hasSubSources: false,
  },
]

// Source - matches source table (no status, just container)
export interface Source {
  id: string  // UUID
  channelId: FixedChannelType
  name: string
  contactPhone?: string
  createdAt?: string
}

// SubSource status types based on channel trust level
// Untrusted (perf_marketing): incubation -> Lead, live -> Client, paused -> Blocked
// Trusted (all others): active -> Client, inactive -> Blocked
export type UntrustedSubSourceStatus = 'incubation' | 'live' | 'paused'
export type TrustedSubSourceStatus = 'active' | 'inactive'
export type SubSourceStatus = UntrustedSubSourceStatus | TrustedSubSourceStatus

// SubSource - matches sub_source table
export interface SubSource {
  id: string  // UUID
  sourceId: string
  sourceName?: string  // Parent source name (for display)
  channelId?: FixedChannelType  // Channel ID (for filtering by trust level)
  name: string
  contactPhone?: string
  status: SubSourceStatus
  defaultSlaMin?: number  // SLA in minutes (optional)
  createdAt?: string
}

// Helper to get channel config
export function getChannelConfig(channelId: FixedChannelType): FixedChannel | undefined {
  return FIXED_CHANNELS.find(c => c.id === channelId)
}

// User types
export type UserStatus = 'active' | 'inactive'

export interface User {
  id: number
  username: string
  email: string
  firstName: string
  lastName: string
  status: UserStatus
  dateJoined: string
}

// Bank Product types
export type MortgageType = 'ISLAMIC' | 'CONVENTIONAL'
export type InterestRateType = 'fixed' | 'variable'
export type FollowOnRateType = 'variable_addition' | 'fixed'
export type EmploymentType = 'SALARIED' | 'SELF EMPLOYMENT' | 'ALL'
export type TransactionType = 'PRIMARY PURCHASE' | 'RESALE' | 'HANDOVER' | 'PRIMARY/RESALE/HANDOVER' | 'BUYOUT' | 'EQUITY RELEASE'
export type ResidencyStatus = 'UAE RESIDENT' | 'UAE NATIONAL' | 'NON RESIDENT' | 'ALL'
export type EiborType = 'EIBOR 3 MONTH' | 'EIBOR 6 MONTH' | 'EIBOR 1 YEAR'
export type PaymentPeriod = 'monthly' | 'annually' | 'one_time'

export interface CustomerSegment {
  type_of_account: string
  profile: string
  description?: string | null
}

export interface BankProduct {
  id: number
  // Basic info
  bankName: string
  bankLogo?: string | null
  bankIcon?: string | null

  // Rate information
  eiborRate?: number | null
  eiborType: EiborType
  variableRateAddition: number
  minimumRate: number
  fixedUntil: number
  fixedRate: number
  followOnRate?: number | null
  followOnRateType: FollowOnRateType
  interestRate?: number | null
  interestRateType: InterestRateType

  // Product classification
  typeOfMortgage: MortgageType
  typeOfAccount?: string | null
  typeOfEmployment: EmploymentType
  typeOfTransaction: TransactionType
  citizenState: ResidencyStatus

  // Insurance
  lifeInsurance: number
  lifeInsurancePaymentPeriod: PaymentPeriod
  propertyInsurance: number
  propertyInsurancePaymentPeriod: PaymentPeriod

  // Fees
  homeValuationFee: number
  preApprovalFee: number
  mortgageProcessingFee: number
  mortgageProcessingFeeAsAmount?: number | null
  minimumMortgageProcessingFee: number
  buyoutProcessingFee: number

  // Terms and conditions
  overpaymentFee?: string | null
  earlySettlementFee?: string | null

  // LTV and limits
  loanToValueRatio: number
  loanToValueThreshold?: number | null
  maximumLengthOfMortgage: number
  mortgageContractMonths: number

  // Monthly payment
  monthlyPayment?: number | null

  // Additional features
  hasFeeFinancing: boolean
  includesAgencyFees: boolean
  includesGovernmentFees: boolean
  isExclusive: boolean

  // Customer segments
  customerSegments: CustomerSegment[]

  // Additional info
  additionalInformation?: string | null
  description?: string | null

  // Status
  isActive: boolean
  expiryDate?: string | null

  // Timestamps
  createdAt: string
  updatedAt: string
}

// EIBOR Rates
export type EiborTerm = 'overnight' | '1_week' | '1_month' | '3_months' | '6_months' | '1_year'

export interface EiborRate {
  id: number
  term: EiborTerm
  rate: number
  date: string
  created_at: string
}

export interface EiborRatesLatest {
  overnight: number | null
  oneWeek: number | null
  oneMonth: number | null
  threeMonths: number | null
  sixMonths: number | null
  oneYear: number | null
  lastUpdated: string | null
}

// Bank product filters
export interface BankProductFilters {
  isActive?: boolean
  bankName?: string
  mortgageType?: MortgageType
  employmentType?: EmploymentType
  transactionType?: TransactionType
  residency?: ResidencyStatus
  rateType?: InterestRateType
  isExclusive?: boolean
  ltvMin?: number
}