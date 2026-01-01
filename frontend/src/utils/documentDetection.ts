import type { DocumentType } from '../types/clients'
import type { BankFormType } from '../types/cases'

/**
 * Detect client document type from filename
 */
export function detectDocumentType(fileName: string): DocumentType {
  const lowerName = fileName.toLowerCase()

  if (lowerName.includes('passport')) {
    return 'passport'
  } else if (lowerName.includes('eid') || lowerName.includes('emirates')) {
    return 'emiratesId'
  } else if (lowerName.includes('visa')) {
    return 'visa'
  } else if (lowerName.includes('salary') || lowerName.includes('certificate')) {
    return 'salaryCertificate'
  } else if (lowerName.includes('payslip')) {
    return 'payslips'
  } else if (lowerName.includes('statement') || lowerName.includes('bank')) {
    return 'bankStatements'
  } else if (lowerName.includes('credit')) {
    return 'creditCardStatement'
  } else if (lowerName.includes('loan')) {
    return 'loanStatements'
  }

  return 'other'
}

/**
 * Detect bank form type from filename
 */
export function detectBankFormType(fileName: string): BankFormType {
  const lowerName = fileName.toLowerCase()

  if (lowerName.includes('account') || lowerName.includes('opening')) {
    return 'accountOpeningForm'
  } else if (lowerName.includes('fts')) {
    return 'fts'
  } else if (lowerName.includes('kfs')) {
    return 'kfs'
  } else if (lowerName.includes('undertaking')) {
    return 'undertakings'
  } else if (lowerName.includes('checklist')) {
    return 'bankChecklist'
  }

  return 'other'
}
