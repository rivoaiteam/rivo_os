/**
 * Client Create Panel Component
 * Single responsibility: Creating new clients
 */

import { useState, useEffect } from 'react'
import type { ResidencyStatus, EmploymentStatus } from '@/types/clients'
import { SidePanel, SidePanelContent } from '@/components/ui/SidePanel'
import { useSubSources } from '@/hooks/useSettings'
import { FIXED_CHANNELS } from '@/types/settings'

// Common nationalities for dropdown
const NATIONALITIES = [
  'Afghan', 'Albanian', 'Algerian', 'American', 'Andorran', 'Angolan', 'Argentine',
  'Armenian', 'Australian', 'Austrian', 'Azerbaijani', 'Bahraini', 'Bangladeshi',
  'Belgian', 'Brazilian', 'British', 'Bulgarian', 'Canadian', 'Chinese', 'Colombian',
  'Croatian', 'Czech', 'Danish', 'Dutch', 'Egyptian', 'Emirati', 'Ethiopian',
  'Filipino', 'Finnish', 'French', 'German', 'Greek', 'Hungarian', 'Indian',
  'Indonesian', 'Iranian', 'Iraqi', 'Irish', 'Israeli', 'Italian', 'Japanese',
  'Jordanian', 'Kazakh', 'Kenyan', 'Korean', 'Kuwaiti', 'Lebanese', 'Libyan',
  'Malaysian', 'Mexican', 'Moroccan', 'Nepalese', 'New Zealander', 'Nigerian',
  'Norwegian', 'Omani', 'Pakistani', 'Palestinian', 'Peruvian', 'Polish',
  'Portuguese', 'Qatari', 'Romanian', 'Russian', 'Saudi', 'Serbian', 'Singaporean',
  'South African', 'Spanish', 'Sri Lankan', 'Sudanese', 'Swedish', 'Swiss',
  'Syrian', 'Taiwanese', 'Thai', 'Tunisian', 'Turkish', 'Ukrainian', 'Uzbek',
  'Venezuelan', 'Vietnamese', 'Yemeni', 'Other'
]

export interface ClientFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  residencyStatus: ResidencyStatus
  dateOfBirth: string
  nationality: string
  employmentStatus: EmploymentStatus
  monthlySalary: number
  monthlyLiabilities?: number
  loanAmount?: number
  estimatedPropertyValue?: number
  sourceId?: string
  sourceChannel: string
}

type ValidationErrors = {
  [K in keyof ClientFormData]?: string
}

interface ClientCreatePanelProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (data: ClientFormData) => void
}

const DEFAULT_FORM_DATA: Partial<ClientFormData> = {
  residencyStatus: 'uaeResident',
  employmentStatus: 'salaried',
}

const INPUT_CLASSES = 'w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500'

export function ClientCreatePanel({ isOpen, onClose, onCreate }: ClientCreatePanelProps) {
  const [formData, setFormData] = useState<Partial<ClientFormData>>(DEFAULT_FORM_DATA)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [touched, setTouched] = useState<Set<string>>(new Set())

  // Fetch trusted sources
  const { data: allSubSources = [] } = useSubSources()
  const trustedChannelIds = FIXED_CHANNELS.filter(c => c.trustLevel === 'trusted').map(c => c.id)
  const trustedSubSources = allSubSources.filter(sub =>
    sub.channelId && trustedChannelIds.includes(sub.channelId)
  )

  // Reset form when panel opens
  useEffect(() => {
    if (isOpen) {
      setFormData(DEFAULT_FORM_DATA)
      setErrors({})
      setTouched(new Set())
    }
  }, [isOpen])

  // Derived: eligibility calculations
  const salary = formData.monthlySalary || 0
  const liabilities = formData.monthlyLiabilities || 0
  const loanAmount = formData.loanAmount || 0
  const propertyValue = formData.estimatedPropertyValue || 0

  const dbr = salary > 0 && liabilities ? (liabilities / salary * 100) : null
  const ltv = propertyValue > 0 && loanAmount ? (loanAmount / propertyValue * 100) : null
  const maxLoan = salary > 0 ? (salary * 0.5 - liabilities) * 240 : null

  const validate = (): boolean => {
    const newErrors: ValidationErrors = {}

    if (!formData.firstName?.trim()) newErrors.firstName = 'Required'
    if (!formData.lastName?.trim()) newErrors.lastName = 'Required'
    if (!formData.email?.trim()) {
      newErrors.email = 'Required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email'
    }
    if (!formData.phone?.trim()) newErrors.phone = 'Required'
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Required'
    } else if (new Date(formData.dateOfBirth) > new Date()) {
      newErrors.dateOfBirth = 'DOB cannot be in future'
    }
    if (!formData.nationality) newErrors.nationality = 'Required'
    if (!formData.monthlySalary || formData.monthlySalary <= 0) newErrors.monthlySalary = formData.monthlySalary && formData.monthlySalary < 0 ? 'Must be positive' : 'Required'
    if (formData.monthlyLiabilities && formData.monthlyLiabilities < 0) newErrors.monthlyLiabilities = 'Must be positive'
    if (!formData.loanAmount || formData.loanAmount <= 0) newErrors.loanAmount = formData.loanAmount && formData.loanAmount < 0 ? 'Must be positive' : 'Required'
    if (!formData.estimatedPropertyValue || formData.estimatedPropertyValue <= 0) newErrors.estimatedPropertyValue = formData.estimatedPropertyValue && formData.estimatedPropertyValue < 0 ? 'Must be positive' : 'Required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const markTouched = (field: keyof ClientFormData) => {
    setTouched(prev => new Set(prev).add(field))
    validate()
  }

  const updateField = <K extends keyof ClientFormData>(field: K, value: ClientFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const submitForm = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(new Set(['firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'nationality', 'monthlySalary', 'loanAmount', 'estimatedPropertyValue']))

    if (!validate()) return

    onCreate(formData as ClientFormData)
    setFormData(DEFAULT_FORM_DATA)
    setErrors({})
    setTouched(new Set())
  }

  const getInputClassName = (field: keyof ClientFormData) => {
    const hasError = touched.has(field) && errors[field]
    if (hasError) {
      return `${INPUT_CLASSES.replace('focus:ring-blue-500', '')} border-red-300 focus:ring-red-300`
    }
    return INPUT_CLASSES
  }

  return (
    <SidePanel isOpen={isOpen} onClose={onClose} title="Create Client">
      <form onSubmit={submitForm} className="flex flex-col flex-1 min-h-0">
        <SidePanelContent className="space-y-6">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-x-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">First Name *</label>
              <input
                type="text"
                value={formData.firstName || ''}
                onChange={(e) => updateField('firstName', e.target.value)}
                onBlur={() => markTouched('firstName')}
                className={getInputClassName('firstName')}
              />
              {touched.has('firstName') && errors.firstName && (
                <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Last Name *</label>
              <input
                type="text"
                value={formData.lastName || ''}
                onChange={(e) => updateField('lastName', e.target.value)}
                onBlur={() => markTouched('lastName')}
                className={getInputClassName('lastName')}
              />
              {touched.has('lastName') && errors.lastName && (
                <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>
              )}
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Email *</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => updateField('email', e.target.value)}
                onBlur={() => markTouched('email')}
                className={getInputClassName('email')}
              />
              {touched.has('email') && errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email}</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Phone Number *</label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => updateField('phone', e.target.value)}
                onBlur={() => markTouched('phone')}
                placeholder="+971 50 123 4567"
                className={getInputClassName('phone')}
              />
              {touched.has('phone') && errors.phone && (
                <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
              )}
            </div>
          </div>

          {/* Source */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Source</label>
              <select
                value={formData.sourceId || ''}
                onChange={(e) => updateField('sourceId', e.target.value || undefined)}
                className={INPUT_CLASSES}
              >
                <option value="">Select source</option>
                {trustedSubSources.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.sourceName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Residency & Employment */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Residency Status *</label>
              <select
                value={formData.residencyStatus}
                onChange={(e) => updateField('residencyStatus', e.target.value as ResidencyStatus)}
                className={INPUT_CLASSES}
              >
                <option value="uaeNational">UAE National</option>
                <option value="uaeResident">UAE Resident</option>
                <option value="nonResident">Non-Resident</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Employment Status *</label>
              <select
                value={formData.employmentStatus}
                onChange={(e) => updateField('employmentStatus', e.target.value as EmploymentStatus)}
                className={INPUT_CLASSES}
              >
                <option value="salaried">Salaried</option>
                <option value="selfEmployed">Self-Employed</option>
              </select>
            </div>
          </div>

          {/* DOB & Nationality */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Date of Birth *</label>
              <input
                type="date"
                value={formData.dateOfBirth || ''}
                onChange={(e) => updateField('dateOfBirth', e.target.value)}
                onBlur={() => markTouched('dateOfBirth')}
                className={getInputClassName('dateOfBirth')}
              />
              {touched.has('dateOfBirth') && errors.dateOfBirth && (
                <p className="mt-1 text-xs text-red-500">{errors.dateOfBirth}</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Nationality *</label>
              <select
                value={formData.nationality || ''}
                onChange={(e) => updateField('nationality', e.target.value)}
                onBlur={() => markTouched('nationality')}
                className={getInputClassName('nationality')}
              >
                <option value="">Select</option>
                {NATIONALITIES.map((nationality) => (
                  <option key={nationality} value={nationality}>{nationality}</option>
                ))}
              </select>
              {touched.has('nationality') && errors.nationality && (
                <p className="mt-1 text-xs text-red-500">{errors.nationality}</p>
              )}
            </div>
          </div>

          {/* Financial Fields */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Monthly Salary (AED) *</label>
              <input
                type="number"
                value={formData.monthlySalary || ''}
                onChange={(e) => updateField('monthlySalary', Number(e.target.value))}
                onBlur={() => markTouched('monthlySalary')}
                placeholder="25000"
                className={getInputClassName('monthlySalary')}
              />
              {touched.has('monthlySalary') && errors.monthlySalary && (
                <p className="mt-1 text-xs text-red-500">{errors.monthlySalary}</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Monthly Liabilities (AED)</label>
              <input
                type="number"
                value={formData.monthlyLiabilities || ''}
                onChange={(e) => { updateField('monthlyLiabilities', Number(e.target.value)); markTouched('monthlyLiabilities') }}
                placeholder="5000"
                className={getInputClassName('monthlyLiabilities')}
              />
              {touched.has('monthlyLiabilities') && errors.monthlyLiabilities && (
                <p className="mt-1 text-xs text-red-500">{errors.monthlyLiabilities}</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Loan Amount (AED) *</label>
              <input
                type="number"
                value={formData.loanAmount || ''}
                onChange={(e) => updateField('loanAmount', Number(e.target.value))}
                onBlur={() => markTouched('loanAmount')}
                placeholder="800000"
                className={getInputClassName('loanAmount')}
              />
              {touched.has('loanAmount') && errors.loanAmount && (
                <p className="mt-1 text-xs text-red-500">{errors.loanAmount}</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Property Value (AED) *</label>
              <input
                type="number"
                value={formData.estimatedPropertyValue || ''}
                onChange={(e) => updateField('estimatedPropertyValue', Number(e.target.value))}
                onBlur={() => markTouched('estimatedPropertyValue')}
                placeholder="1000000"
                className={getInputClassName('estimatedPropertyValue')}
              />
              {touched.has('estimatedPropertyValue') && errors.estimatedPropertyValue && (
                <p className="mt-1 text-xs text-red-500">{errors.estimatedPropertyValue}</p>
              )}
            </div>
          </div>

          {/* Eligibility Indicators */}
          {salary > 0 && (
            <EligibilityIndicators dbr={dbr} ltv={ltv} maxLoan={maxLoan} />
          )}
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
              Create Client
            </button>
          </div>
        </div>
      </form>
    </SidePanel>
  )
}

// Sub-component
function EligibilityIndicators({ dbr, ltv, maxLoan }: { dbr: number | null; ltv: number | null; maxLoan: number | null }) {
  return (
    <div className="mt-4 p-3 bg-slate-50 rounded-lg">
      <div className="grid grid-cols-3 gap-4">
        {/* DBR */}
        <div>
          <div className="text-xs text-slate-500 mb-1">DBR</div>
          {dbr != null ? (
            <>
              <div className={`text-sm font-semibold ${dbr > 50 ? 'text-amber-600' : 'text-green-600'}`}>
                {dbr.toFixed(1)}%
              </div>
              <div className="mt-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${dbr > 50 ? 'bg-amber-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(dbr, 100)}%` }}
                />
              </div>
            </>
          ) : (
            <div className="text-sm text-slate-400">—</div>
          )}
        </div>

        {/* LTV */}
        <div>
          <div className="text-xs text-slate-500 mb-1">LTV</div>
          {ltv != null ? (
            <>
              <div className={`text-sm font-semibold ${ltv > 80 ? 'text-amber-600' : 'text-green-600'}`}>
                {ltv.toFixed(1)}%
              </div>
              <div className="mt-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${ltv > 80 ? 'bg-amber-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(ltv, 100)}%` }}
                />
              </div>
            </>
          ) : (
            <div className="text-sm text-slate-400">—</div>
          )}
        </div>

        {/* Max Loan */}
        <div>
          <div className="text-xs text-slate-500 mb-1">Max Loan Amount</div>
          <div className="text-sm font-semibold text-slate-900">
            {maxLoan && maxLoan > 0 ? `AED ${Math.round(maxLoan).toLocaleString()}` : '—'}
          </div>
        </div>
      </div>
    </div>
  )
}
