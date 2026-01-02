/**
 * Bank Products Page - Toolbox section for viewing bank product catalog
 */

import { useState, useMemo } from 'react'
import { Search, TrendingUp, X } from 'lucide-react'
import { useBankProducts, useEiborRatesLatest } from '@/hooks/useSettings'
import { EmptyState } from '@/components/ui/EmptyState'
import { FilterButton } from '@/components/ui/FilterButton'
import { Pagination } from '@/components/ui/Pagination'
import { SidePanel, SidePanelContent } from '@/components/ui/SidePanel'
import type {
  BankProduct,
  MortgageType,
  EmploymentType,
  TransactionType,
  ResidencyStatus,
  InterestRateType,
} from '@/types/settings'

// Product details side panel
function ProductDetailsSidePanel({
  product,
  isOpen,
  onClose,
}: {
  product: BankProduct | null
  isOpen: boolean
  onClose: () => void
}) {
  if (!product) return null

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title="Product details"
    >
      <SidePanelContent>
        {/* Bank info card */}
        <div className="p-4 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-4">
            {product.bankIcon ? (
              <img src={product.bankIcon} alt={product.bankName} className="w-10 h-10 rounded" />
            ) : (
              <div className="w-10 h-10 rounded bg-slate-200 flex items-center justify-center text-slate-500 text-sm font-medium">
                {product.bankName.charAt(0)}
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-medium text-slate-900">{product.bankName}</h3>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 text-xs">
            <div className="text-center">
              <div className="text-slate-500">Interest rate</div>
              <div className="font-medium text-slate-900">
                {product.interestRate ?? 0}%
              </div>
              <div className="text-slate-400">{product.eiborType}</div>
            </div>
            <div className="text-center">
              <div className="text-slate-500">Bank fees</div>
              <div className="font-medium text-slate-900">
                {product.mortgageProcessingFee}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-slate-500">Follow on rate</div>
              <div className="font-medium text-slate-900">
                {product.followOnRate ?? 0}%
              </div>
              <div className="text-slate-400">{product.eiborType}</div>
            </div>
          </div>
        </div>

        {/* Type badges */}
        <div className="mt-2 flex items-center gap-4">
          <div>
            <div className="text-xs text-slate-500 mb-1">Mortgage type</div>
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${
              product.typeOfMortgage === 'ISLAMIC'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-blue-100 text-blue-700'
            }`}>
              {product.typeOfMortgage === 'ISLAMIC' ? 'Islamic' : 'Conventional'}
            </span>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">Transaction type</div>
            <span className="px-2 py-0.5 text-xs font-medium rounded bg-slate-100 text-slate-600">
              {product.typeOfTransaction}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="mt-6 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Residency status</span>
            <span className="text-slate-900 font-medium">
              {product.citizenState.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Employment status</span>
            <span className="text-slate-900 font-medium">
              {product.typeOfEmployment.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">LTV</span>
            <span className="text-slate-900 font-medium">
              {product.loanToValueRatio > 0 ? `${product.loanToValueRatio}%` : '-'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Minimum floor rate</span>
            <span className="text-slate-900 font-medium">
              {product.minimumRate > 0
                ? `${product.minimumRate}%`
                : 'No minimum rate set by bank'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Property valuation fee</span>
            <span className="text-slate-900 font-medium">
              AED {product.homeValuationFee.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Pre-approval fee</span>
            <span className="text-slate-900 font-medium">
              AED {product.preApprovalFee.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Processing fee</span>
            <span className="text-slate-900 font-medium">
              {product.mortgageProcessingFee}%
              {product.minimumMortgageProcessingFee > 0 && ` (min AED ${product.minimumMortgageProcessingFee.toLocaleString()})`}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Monthly payment</span>
            <span className="text-slate-900 font-medium">
              {product.monthlyPayment ? `AED ${product.monthlyPayment.toLocaleString()}` : '-'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Property insurance</span>
            <span className="text-slate-900 font-medium">
              {product.propertyInsurance}% per {product.propertyInsurancePaymentPeriod}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Life insurance</span>
            <span className="text-slate-900 font-medium">
              {product.lifeInsurance}% per {product.lifeInsurancePaymentPeriod}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Overpayment fee</span>
            <span className="text-slate-900 font-medium text-right max-w-[180px]">
              {product.overpaymentFee || '-'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Early settlement fee</span>
            <span className="text-slate-900 font-medium text-right max-w-[180px]">
              {product.earlySettlementFee || '-'}
            </span>
          </div>
          {product.buyoutProcessingFee > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Buyout fee</span>
              <span className="text-slate-900 font-medium">
                AED {product.buyoutProcessingFee.toLocaleString()}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Customer profile</span>
            <span className="text-slate-900 font-medium">
              {product.customerSegments?.[0]?.profile || '-'}
            </span>
          </div>
        </div>

        {/* Additional information */}
        {product.additionalInformation && (
          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <div className="text-sm text-slate-500 mb-1">Additional information</div>
            <div className="text-sm text-slate-900">
              {product.additionalInformation}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-200 text-xs text-slate-500">
          Last modified: {new Date(product.updatedAt).toLocaleDateString()} {new Date(product.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </SidePanelContent>
    </SidePanel>
  )
}

// EIBOR Rates side panel
function EiborRatesSidePanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { data: rates } = useEiborRatesLatest()

  const rateItems = [
    { label: 'Overnight', value: rates?.overnight },
    { label: '1 week', value: rates?.oneWeek },
    { label: '1 month', value: rates?.oneMonth },
    { label: '3 months', value: rates?.threeMonths },
    { label: '6 months', value: rates?.sixMonths },
    { label: '1 year', value: rates?.oneYear },
  ]

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title="EIBOR Daily Rates"
      subtitle={rates?.lastUpdated ? `Last updated: ${new Date(rates.lastUpdated).toLocaleDateString()}` : undefined}
    >
      <SidePanelContent>
        <div className="grid grid-cols-2 gap-4">
          {rateItems.map((item) => (
            <div
              key={item.label}
              className="bg-slate-100 rounded-lg p-4"
            >
              <div className="text-xs text-slate-500 mb-1">{item.label}</div>
              <div className="text-2xl text-slate-900">
                {item.value?.toFixed(3) ?? '-'}
              </div>
              <div className="text-xs text-slate-400 mt-1">%</div>
            </div>
          ))}
        </div>
      </SidePanelContent>
    </SidePanel>
  )
}

// Filter options - based on actual bank names in data
const bankOptions = [
  { value: 'EIB', label: 'EIB - Business Banking' },
  { value: 'DIB', label: 'DIB - Business Banking' },
  { value: 'RAK', label: 'RAK - Business Banking' },
  { value: 'FAB', label: 'FAB - Business Banking' },
  { value: 'Mashreq', label: 'Mashreq - Business Banking' },
  { value: 'Invest Bank', label: 'Invest Bank - Business Banking' },
  { value: 'MBank', label: 'MBank - Business Banking' },
  { value: 'Ajman Bank', label: 'Ajman Bank - Business Banking' },
  { value: 'SIB', label: 'SIB - Business Banking' },
]

// Note: "ALL" options removed - the dropdown already has an "All" option at the top
const employmentOptions: { value: EmploymentType; label: string }[] = [
  { value: 'SALARIED', label: 'Salaried' },
  { value: 'SELF EMPLOYMENT', label: 'Self Employed' },
]

const residencyOptions: { value: ResidencyStatus; label: string }[] = [
  { value: 'UAE RESIDENT', label: 'UAE Resident' },
  { value: 'UAE NATIONAL', label: 'UAE National' },
  { value: 'NON RESIDENT', label: 'Non Resident' },
]

const mortgageTypeOptions: { value: MortgageType; label: string }[] = [
  { value: 'ISLAMIC', label: 'Islamic' },
  { value: 'CONVENTIONAL', label: 'Conventional' },
]

const transactionTypeOptions: { value: TransactionType; label: string }[] = [
  { value: 'PRIMARY PURCHASE', label: 'Primary Purchase' },
  { value: 'RESALE', label: 'Resale' },
  { value: 'HANDOVER', label: 'Handover' },
  { value: 'BUYOUT', label: 'Buyout' },
  { value: 'EQUITY RELEASE', label: 'Equity Release' },
]

const rateTypeOptions: { value: InterestRateType; label: string }[] = [
  { value: 'fixed', label: 'Fixed' },
  { value: 'variable', label: 'Variable' },
]

const ltvOptions = [
  { value: '50', label: 'Up to 50%' },
  { value: '60', label: 'Up to 60%' },
  { value: '70', label: 'Up to 70%' },
  { value: '75', label: 'Up to 75%' },
  { value: '80', label: 'Up to 80%' },
  { value: '85', label: 'Up to 85%' },
]

const exclusivityOptions = [
  { value: 'exclusive', label: 'Exclusive' },
  { value: 'non-exclusive', label: 'Non-Exclusive' },
]

export default function BankProductsPage() {
  const [search, setSearch] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<BankProduct | null>(null)
  const [showEiborModal, setShowEiborModal] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Filters
  const [bankFilter, setBankFilter] = useState<string>()
  const [employmentFilter, setEmploymentFilter] = useState<EmploymentType>()
  const [residencyFilter, setResidencyFilter] = useState<ResidencyStatus>()
  const [mortgageFilter, setMortgageFilter] = useState<MortgageType>()
  const [transactionFilter, setTransactionFilter] = useState<TransactionType>()
  const [rateTypeFilter, setRateTypeFilter] = useState<InterestRateType>()
  const [ltvFilter, setLtvFilter] = useState<string>()
  const [exclusivityFilter, setExclusivityFilter] = useState<string>()

  // Filter dropdown open states
  const [bankFilterOpen, setBankFilterOpen] = useState(false)
  const [employmentFilterOpen, setEmploymentFilterOpen] = useState(false)
  const [residencyFilterOpen, setResidencyFilterOpen] = useState(false)
  const [mortgageFilterOpen, setMortgageFilterOpen] = useState(false)
  const [transactionFilterOpen, setTransactionFilterOpen] = useState(false)
  const [rateTypeFilterOpen, setRateTypeFilterOpen] = useState(false)
  const [ltvFilterOpen, setLtvFilterOpen] = useState(false)
  const [exclusivityFilterOpen, setExclusivityFilterOpen] = useState(false)

  // Always fetch only active products with pagination
  const { data: paginatedProducts } = useBankProducts({
    isActive: true,
    bankName: bankFilter,
    employmentType: employmentFilter,
    residency: residencyFilter,
    mortgageType: mortgageFilter,
    transactionType: transactionFilter,
    rateType: rateTypeFilter,
    isExclusive: exclusivityFilter === 'exclusive' ? true : exclusivityFilter === 'non-exclusive' ? false : undefined,
    ltvMin: ltvFilter ? Number(ltvFilter) : undefined,
    page,
    pageSize,
  })

  // Extract products and pagination info from response
  const products = paginatedProducts?.results || []
  const pagination = paginatedProducts ? {
    count: paginatedProducts.count,
    totalPages: paginatedProducts.totalPages,
    currentPage: paginatedProducts.currentPage,
    pageSize: paginatedProducts.pageSize,
  } : null

  // Client-side search filter
  const filteredProducts = useMemo(() => {
    if (!search) return products
    const searchLower = search.toLowerCase()
    return products.filter(
      (p) =>
        p.bankName.toLowerCase().includes(searchLower) ||
        p.typeOfMortgage.toLowerCase().includes(searchLower) ||
        p.typeOfEmployment.toLowerCase().includes(searchLower)
    )
  }, [products, search])

  const hasFilters = bankFilter || employmentFilter || residencyFilter || mortgageFilter || transactionFilter || rateTypeFilter || ltvFilter || exclusivityFilter

  const clearFilters = () => {
    setBankFilter(undefined)
    setEmploymentFilter(undefined)
    setResidencyFilter(undefined)
    setMortgageFilter(undefined)
    setTransactionFilter(undefined)
    setRateTypeFilter(undefined)
    setLtvFilter(undefined)
    setExclusivityFilter(undefined)
    setBankFilterOpen(false)
    setEmploymentFilterOpen(false)
    setResidencyFilterOpen(false)
    setMortgageFilterOpen(false)
    setTransactionFilterOpen(false)
    setRateTypeFilterOpen(false)
    setLtvFilterOpen(false)
    setExclusivityFilterOpen(false)
    setPage(1)
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setPage(1)
  }


  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Bank Products</h1>
            <p className="text-sm text-slate-500 mt-1">
              Find the most accurate bank rates and products
            </p>
          </div>
          <button
            onClick={() => setShowEiborModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            See EIBOR rates
          </button>
        </div>

        {/* Filters and Search */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 w-64 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            {/* Bank Filter */}
          <div className="relative">
            <FilterButton
              label="Bank"
              value={bankOptions.find(o => o.value === bankFilter)?.label}
              isOpen={bankFilterOpen}
              onClick={() => setBankFilterOpen(!bankFilterOpen)}
            />
            {bankFilterOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setBankFilterOpen(false)} />
                <div className="absolute left-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-slate-200 z-20 py-1">
                  <button
                    onClick={() => { setBankFilter(undefined); setBankFilterOpen(false) }}
                    className="w-full px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
                  >
                    All
                  </button>
                  {bankOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => { setBankFilter(option.value); setBankFilterOpen(false) }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                        bankFilter === option.value ? 'text-blue-600' : 'text-slate-600'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Employment Filter */}
          <div className="relative">
            <FilterButton
              label="Employment"
              value={employmentOptions.find(o => o.value === employmentFilter)?.label}
              isOpen={employmentFilterOpen}
              onClick={() => setEmploymentFilterOpen(!employmentFilterOpen)}
            />
            {employmentFilterOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setEmploymentFilterOpen(false)} />
                <div className="absolute left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-20 py-1">
                  <button
                    onClick={() => { setEmploymentFilter(undefined); setEmploymentFilterOpen(false) }}
                    className="w-full px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
                  >
                    All
                  </button>
                  {employmentOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => { setEmploymentFilter(option.value); setEmploymentFilterOpen(false) }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                        employmentFilter === option.value ? 'text-blue-600' : 'text-slate-600'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Residency Filter */}
          <div className="relative">
            <FilterButton
              label="Residency"
              value={residencyOptions.find(o => o.value === residencyFilter)?.label}
              isOpen={residencyFilterOpen}
              onClick={() => setResidencyFilterOpen(!residencyFilterOpen)}
            />
            {residencyFilterOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setResidencyFilterOpen(false)} />
                <div className="absolute left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-20 py-1">
                  <button
                    onClick={() => { setResidencyFilter(undefined); setResidencyFilterOpen(false) }}
                    className="w-full px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
                  >
                    All
                  </button>
                  {residencyOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => { setResidencyFilter(option.value); setResidencyFilterOpen(false) }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                        residencyFilter === option.value ? 'text-blue-600' : 'text-slate-600'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Mortgage Type Filter */}
          <div className="relative">
            <FilterButton
              label="Mortgage"
              value={mortgageTypeOptions.find(o => o.value === mortgageFilter)?.label}
              isOpen={mortgageFilterOpen}
              onClick={() => setMortgageFilterOpen(!mortgageFilterOpen)}
            />
            {mortgageFilterOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMortgageFilterOpen(false)} />
                <div className="absolute left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-20 py-1">
                  <button
                    onClick={() => { setMortgageFilter(undefined); setMortgageFilterOpen(false) }}
                    className="w-full px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
                  >
                    All
                  </button>
                  {mortgageTypeOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => { setMortgageFilter(option.value); setMortgageFilterOpen(false) }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                        mortgageFilter === option.value ? 'text-blue-600' : 'text-slate-600'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Transaction Type Filter */}
          <div className="relative">
            <FilterButton
              label="Transaction"
              value={transactionTypeOptions.find(o => o.value === transactionFilter)?.label}
              isOpen={transactionFilterOpen}
              onClick={() => setTransactionFilterOpen(!transactionFilterOpen)}
            />
            {transactionFilterOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setTransactionFilterOpen(false)} />
                <div className="absolute left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-20 py-1">
                  <button
                    onClick={() => { setTransactionFilter(undefined); setTransactionFilterOpen(false) }}
                    className="w-full px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
                  >
                    All
                  </button>
                  {transactionTypeOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => { setTransactionFilter(option.value); setTransactionFilterOpen(false) }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                        transactionFilter === option.value ? 'text-blue-600' : 'text-slate-600'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Rate Type Filter */}
          <div className="relative">
            <FilterButton
              label="Rate"
              value={rateTypeOptions.find(o => o.value === rateTypeFilter)?.label}
              isOpen={rateTypeFilterOpen}
              onClick={() => setRateTypeFilterOpen(!rateTypeFilterOpen)}
            />
            {rateTypeFilterOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setRateTypeFilterOpen(false)} />
                <div className="absolute left-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-slate-200 z-20 py-1">
                  <button
                    onClick={() => { setRateTypeFilter(undefined); setRateTypeFilterOpen(false) }}
                    className="w-full px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
                  >
                    All
                  </button>
                  {rateTypeOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => { setRateTypeFilter(option.value); setRateTypeFilterOpen(false) }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                        rateTypeFilter === option.value ? 'text-blue-600' : 'text-slate-600'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* LTV Filter */}
          <div className="relative">
            <FilterButton
              label="LTV"
              value={ltvOptions.find(o => o.value === ltvFilter)?.label}
              isOpen={ltvFilterOpen}
              onClick={() => setLtvFilterOpen(!ltvFilterOpen)}
            />
            {ltvFilterOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setLtvFilterOpen(false)} />
                <div className="absolute left-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-slate-200 z-20 py-1">
                  <button
                    onClick={() => { setLtvFilter(undefined); setLtvFilterOpen(false) }}
                    className="w-full px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
                  >
                    All
                  </button>
                  {ltvOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => { setLtvFilter(option.value); setLtvFilterOpen(false) }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                        ltvFilter === option.value ? 'text-blue-600' : 'text-slate-600'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Exclusivity Filter */}
          <div className="relative">
            <FilterButton
              label="Exclusivity"
              value={exclusivityOptions.find(o => o.value === exclusivityFilter)?.label}
              isOpen={exclusivityFilterOpen}
              onClick={() => setExclusivityFilterOpen(!exclusivityFilterOpen)}
            />
            {exclusivityFilterOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setExclusivityFilterOpen(false)} />
                <div className="absolute left-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-slate-200 z-20 py-1">
                  <button
                    onClick={() => { setExclusivityFilter(undefined); setExclusivityFilterOpen(false) }}
                    className="w-full px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
                  >
                    All
                  </button>
                  {exclusivityOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => { setExclusivityFilter(option.value); setExclusivityFilterOpen(false) }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                        exclusivityFilter === option.value ? 'text-blue-600' : 'text-slate-600'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-2 py-1.5 text-sm text-slate-500 hover:text-slate-700"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-slate-100 z-10">
            <tr className="border-b border-slate-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Bank
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Product Info
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Mortgage type
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Transaction type
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Interest
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Bank fees
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Follow on rate
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredProducts.map((product) => (
              <tr
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="hover:bg-slate-50 cursor-pointer"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {product.bankIcon ? (
                      <img src={product.bankIcon} alt={product.bankName} className="w-8 h-8 rounded" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-medium">
                        {product.bankName.charAt(0)}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-slate-900 max-w-[200px]">
                    <div className="font-medium">
                      {product.typeOfMortgage === 'ISLAMIC' ? 'Islamic' : 'Conventional'} – {product.customerSegments?.[0]?.type_of_account || 'Standard'}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {product.citizenState.replace(/_/g, ' ')} · {product.typeOfEmployment.replace(/_/g, ' ')}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                    product.typeOfMortgage === 'ISLAMIC'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {product.typeOfMortgage === 'ISLAMIC' ? 'Islamic' : 'Conventional'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 text-xs font-medium rounded bg-slate-100 text-slate-600">
                    {product.typeOfTransaction}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-slate-900">
                    {product.interestRate ?? 0}%
                  </div>
                  <div className="text-xs text-slate-500">{product.eiborType}</div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-900">
                  {product.mortgageProcessingFee}%
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-slate-900">
                    {product.followOnRate ?? 0}%
                  </div>
                  <div className="text-xs text-slate-500">{product.eiborType}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredProducts.length === 0 && <EmptyState message="No bank products found" />}
      </div>

      {/* Pagination */}
      {pagination && (
        <Pagination
          pagination={pagination}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
        />
      )}

      {/* Product details side panel */}
      <ProductDetailsSidePanel
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      {/* EIBOR rates side panel */}
      <EiborRatesSidePanel isOpen={showEiborModal} onClose={() => setShowEiborModal(false)} />
    </div>
  )
}
