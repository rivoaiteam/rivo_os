/**
 * Case Create Panel Component
 * Single responsibility: Creating new cases
 */

import { useState, useEffect } from 'react'
import { UserCheck, Home, Building2 } from 'lucide-react'
import type { CreateCaseData, ApplicationType, MortgageType, Emirate, TransactionType, PropertyStatus, RateType, RateTerm } from '@/types/cases'
import { EMIRATE_LABELS } from '@/types/cases'
import { SidePanel, SidePanelContent } from '@/components/ui/SidePanel'
import { SectionHeader } from '@/components/ui/InfoBox'

interface ClientForCase {
  id: number
  firstName: string
  lastName: string
  email?: string
  phone: string
  loanAmount?: number
  estimatedPropertyValue?: number
}

interface BankInfo {
  name: string
  icon?: string
}

interface CaseCreatePanelProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (data: CreateCaseData) => void
  clients?: ClientForCase[]
  banks?: BankInfo[]
  onViewClient?: (clientId: number) => void
}

const DEFAULT_FORM_DATA: Partial<CreateCaseData> = {
  caseType: 'residential',
  serviceType: 'fullyPackaged',
  applicationType: 'individual',
  mortgageType: 'islamic',
  emirate: 'dubai',
  transactionType: 'primaryPurchase',
  propertyStatus: 'ready',
  mortgageTermYears: 20,
  mortgageTermMonths: 0,
}

const INPUT_CLASSES = 'w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500'

export function CaseCreatePanel({
  isOpen,
  onClose,
  onCreate,
  clients = [],
  banks = [],
  onViewClient,
}: CaseCreatePanelProps) {
  const [formData, setFormData] = useState<Partial<CreateCaseData>>(DEFAULT_FORM_DATA)

  // Derived state - no useEffect needed
  const selectedClient = clients.find(c => c.id === formData.clientId)

  // Reset form when panel opens
  useEffect(() => {
    if (isOpen) {
      setFormData(DEFAULT_FORM_DATA)
    }
  }, [isOpen])

  const updateField = <K extends keyof CreateCaseData>(field: K, value: CreateCaseData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const selectClient = (clientId: number) => {
    const client = clients.find(c => c.id === clientId)
    setFormData(prev => ({
      ...prev,
      clientId,
      loanAmount: client?.loanAmount || prev.loanAmount,
      estimatedPropertyValue: client?.estimatedPropertyValue || prev.estimatedPropertyValue,
    }))
  }

  const submitForm = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.clientId || !formData.loanAmount || !formData.estimatedPropertyValue) {
      alert('Please fill in all required fields')
      return
    }

    onCreate(formData as CreateCaseData)
    setFormData(DEFAULT_FORM_DATA)
  }

  // Header actions - View Client button
  const headerActions = selectedClient && onViewClient ? (
    <button
      type="button"
      onClick={() => onViewClient(selectedClient.id)}
      className="p-1.5 rounded hover:bg-slate-100"
      title="View Client"
    >
      <UserCheck className="w-4 h-4 text-blue-500" />
    </button>
  ) : undefined

  return (
    <SidePanel isOpen={isOpen} onClose={onClose} title="Create Case" headerActions={headerActions}>
      <form onSubmit={submitForm} className="flex flex-col flex-1 min-h-0">
        <SidePanelContent className="space-y-6">
          {/* Client Selection */}
          <div>
            <label className="block text-xs text-slate-500 mb-1">Client</label>
            <select
              value={formData.clientId || ''}
              onChange={(e) => selectClient(Number(e.target.value))}
              className={INPUT_CLASSES}
              required
            >
              <option value="">Select a client...</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.firstName} {client.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* Case Type Cards */}
          <div className="grid grid-cols-2 gap-3">
            {/* Residential Card */}
            <div
              onClick={() => updateField('caseType', 'residential')}
              className={`flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                formData.caseType === 'residential'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <Home className={`w-6 h-6 ${formData.caseType === 'residential' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span className={`text-sm font-medium ${formData.caseType === 'residential' ? 'text-blue-600' : 'text-slate-600'}`}>
                Residential
              </span>
              {formData.caseType === 'residential' && (
                <ServiceTypeToggle
                  value={formData.serviceType || 'fullyPackaged'}
                  onChange={(value) => updateField('serviceType', value)}
                />
              )}
            </div>

            {/* Commercial Card */}
            <div
              onClick={() => updateField('caseType', 'commercial')}
              className={`flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                formData.caseType === 'commercial'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <Building2 className={`w-6 h-6 ${formData.caseType === 'commercial' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span className={`text-sm font-medium ${formData.caseType === 'commercial' ? 'text-blue-600' : 'text-slate-600'}`}>
                Commercial
              </span>
              {formData.caseType === 'commercial' && (
                <ServiceTypeToggle
                  value={formData.serviceType || 'fullyPackaged'}
                  onChange={(value) => updateField('serviceType', value)}
                />
              )}
            </div>
          </div>

          {/* Application Type */}
          <div>
            <label className="block text-xs text-slate-500 mb-1">Application Type</label>
            <select
              value={formData.applicationType}
              onChange={(e) => updateField('applicationType', e.target.value as ApplicationType)}
              className={INPUT_CLASSES}
            >
              <option value="individual">Individual</option>
              <option value="joint">Joint</option>
            </select>
          </div>

          {/* Property Section */}
          <PropertySection
            emirate={formData.emirate || 'dubai'}
            transactionType={formData.transactionType || 'primaryPurchase'}
            propertyStatus={formData.propertyStatus || 'ready'}
            propertyValue={formData.estimatedPropertyValue}
            onEmirateChange={(v) => updateField('emirate', v)}
            onTransactionTypeChange={(v) => updateField('transactionType', v)}
            onPropertyStatusChange={(v) => updateField('propertyStatus', v)}
            onPropertyValueChange={(v) => updateField('estimatedPropertyValue', v)}
          />

          {/* Loan Section */}
          <LoanSection
            loanAmount={formData.loanAmount}
            termYears={formData.mortgageTermYears || 20}
            termMonths={formData.mortgageTermMonths || 0}
            onLoanAmountChange={(v) => updateField('loanAmount', v)}
            onTermYearsChange={(v) => updateField('mortgageTermYears', v)}
            onTermMonthsChange={(v) => updateField('mortgageTermMonths', v)}
          />

          {/* Bank Product Section */}
          <BankProductSection
            bankName={formData.bankName}
            mortgageType={formData.mortgageType || 'islamic'}
            rateType={formData.rateType}
            ratePercent={formData.ratePercent}
            fixedPeriodYears={formData.fixedPeriodYears}
            banks={banks}
            onBankNameChange={(v) => updateField('bankName', v)}
            onMortgageTypeChange={(v) => updateField('mortgageType', v)}
            onRateTypeChange={(v) => updateField('rateType', v)}
            onRatePercentChange={(v) => updateField('ratePercent', v)}
            onFixedPeriodChange={(v) => updateField('fixedPeriodYears', v)}
          />
        </SidePanelContent>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 bg-white">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Create Case
            </button>
          </div>
        </div>
      </form>
    </SidePanel>
  )
}

// Sub-components for single responsibility

function ServiceTypeToggle({ value, onChange }: { value: string; onChange: (v: 'fullyPackaged' | 'assisted') => void }) {
  return (
    <div className="flex gap-1 mt-1" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => onChange('fullyPackaged')}
        className={`px-2 py-1 text-xs rounded-full transition-all ${
          value === 'fullyPackaged'
            ? 'bg-blue-600 text-white'
            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
        }`}
      >
        Fully Packaged
      </button>
      <button
        type="button"
        onClick={() => onChange('assisted')}
        className={`px-2 py-1 text-xs rounded-full transition-all ${
          value === 'assisted'
            ? 'bg-blue-600 text-white'
            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
        }`}
      >
        Assisted
      </button>
    </div>
  )
}

interface PropertySectionProps {
  emirate: Emirate
  transactionType: TransactionType
  propertyStatus: PropertyStatus
  propertyValue?: number
  onEmirateChange: (v: Emirate) => void
  onTransactionTypeChange: (v: TransactionType) => void
  onPropertyStatusChange: (v: PropertyStatus) => void
  onPropertyValueChange: (v: number) => void
}

function PropertySection(props: PropertySectionProps) {
  return (
    <div>
      <SectionHeader>Property</SectionHeader>
      <div className="grid grid-cols-2 gap-x-3 gap-y-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Emirate</label>
          <select
            value={props.emirate}
            onChange={(e) => props.onEmirateChange(e.target.value as Emirate)}
            className={INPUT_CLASSES}
          >
            {Object.entries(EMIRATE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Transaction Type</label>
          <select
            value={props.transactionType}
            onChange={(e) => props.onTransactionTypeChange(e.target.value as TransactionType)}
            className={INPUT_CLASSES}
          >
            <option value="primaryPurchase">Primary Purchase</option>
            <option value="resale">Resale</option>
            <option value="buyoutEquity">Buyout + Equity</option>
            <option value="buyout">Buyout</option>
            <option value="equity">Equity</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Property Status</label>
          <select
            value={props.propertyStatus}
            onChange={(e) => props.onPropertyStatusChange(e.target.value as PropertyStatus)}
            className={INPUT_CLASSES}
          >
            <option value="ready">Ready</option>
            <option value="underConstruction">Under Construction</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Property Value (AED)</label>
          <input
            type="number"
            value={props.propertyValue || ''}
            onChange={(e) => props.onPropertyValueChange(Number(e.target.value))}
            placeholder="1,000,000"
            className={INPUT_CLASSES}
            required
          />
        </div>
      </div>
    </div>
  )
}

interface LoanSectionProps {
  loanAmount?: number
  termYears: number
  termMonths: number
  onLoanAmountChange: (v: number) => void
  onTermYearsChange: (v: number) => void
  onTermMonthsChange: (v: number) => void
}

function LoanSection(props: LoanSectionProps) {
  return (
    <div>
      <SectionHeader>Loan</SectionHeader>
      <div className="grid grid-cols-2 gap-x-3 gap-y-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Loan Amount (AED)</label>
          <input
            type="number"
            value={props.loanAmount || ''}
            onChange={(e) => props.onLoanAmountChange(Number(e.target.value))}
            placeholder="800,000"
            className={INPUT_CLASSES}
            required
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Mortgage Term</label>
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <input
                type="number"
                value={props.termYears}
                onChange={(e) => props.onTermYearsChange(Number(e.target.value))}
                min="1"
                max="30"
                className={INPUT_CLASSES}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">yrs</span>
            </div>
            <div className="relative">
              <input
                type="number"
                value={props.termMonths}
                onChange={(e) => props.onTermMonthsChange(Number(e.target.value))}
                min="0"
                max="11"
                className={INPUT_CLASSES}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">mo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface BankProductSectionProps {
  bankName?: string
  mortgageType: MortgageType
  rateType?: RateType
  ratePercent?: number
  fixedPeriodYears?: RateTerm
  banks: BankInfo[]
  onBankNameChange: (v: string) => void
  onMortgageTypeChange: (v: MortgageType) => void
  onRateTypeChange: (v: RateType) => void
  onRatePercentChange: (v: number) => void
  onFixedPeriodChange: (v: RateTerm) => void
}

function BankProductSection(props: BankProductSectionProps) {
  const selectedBankIcon = props.banks.find(b => b.name === props.bankName)?.icon

  return (
    <div>
      <SectionHeader>Bank Product</SectionHeader>
      <div className="grid grid-cols-2 gap-x-3 gap-y-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Bank</label>
          <div className="relative">
            <select
              value={props.bankName || ''}
              onChange={(e) => props.onBankNameChange(e.target.value)}
              className={`${INPUT_CLASSES} ${selectedBankIcon ? 'pl-9' : ''}`}
            >
              <option value="">Select bank...</option>
              {props.banks.map((bank) => (
                <option key={bank.name} value={bank.name}>{bank.name}</option>
              ))}
            </select>
            {selectedBankIcon && (
              <img
                src={selectedBankIcon}
                alt=""
                className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 object-contain pointer-events-none"
              />
            )}
          </div>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Mortgage Type</label>
          <select
            value={props.mortgageType}
            onChange={(e) => props.onMortgageTypeChange(e.target.value as MortgageType)}
            className={INPUT_CLASSES}
          >
            <option value="islamic">Islamic</option>
            <option value="conventional">Conventional</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Rate Type</label>
          <select
            value={props.rateType || ''}
            onChange={(e) => props.onRateTypeChange(e.target.value as RateType)}
            className={INPUT_CLASSES}
          >
            <option value="">Select type...</option>
            <option value="fixed">Fixed</option>
            <option value="variable">Variable</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Rate %</label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="20"
            value={props.ratePercent || ''}
            onChange={(e) => props.onRatePercentChange(Number(e.target.value))}
            placeholder="3.99"
            className={INPUT_CLASSES}
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Fixed Period</label>
          <select
            value={props.fixedPeriodYears || ''}
            onChange={(e) => props.onFixedPeriodChange(Number(e.target.value) as RateTerm)}
            className={INPUT_CLASSES}
          >
            <option value="">Select period...</option>
            <option value="1">1 Year</option>
            <option value="2">2 Years</option>
            <option value="3">3 Years</option>
            <option value="4">4 Years</option>
            <option value="5">5 Years</option>
          </select>
        </div>
      </div>
    </div>
  )
}
