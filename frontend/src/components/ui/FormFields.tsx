/**
 * Shared Form Field Components
 *
 * Use these components for consistent form styling across all side panels.
 * These patterns support both Create and Edit modes with proper validation.
 */

import type { ReactNode } from 'react'

// Common input class patterns
export const FORM_FIELD_CLASSES = {
  // Base input classes (for non-validated fields with default values)
  base: 'w-full px-3 py-2 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500',
  // For validated fields - returns appropriate classes based on error state
  getValidatedClasses: (hasError: boolean) => {
    const baseClasses = 'w-full px-3 py-2 text-sm bg-white dark:bg-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none'
    if (hasError) {
      return `${baseClasses} border border-red-300 focus:border-red-300`
    }
    return `${baseClasses} border border-slate-200 dark:border-slate-600 focus:border-blue-500`
  },
}

// Field label component
interface FieldLabelProps {
  children: ReactNode
  required?: boolean
}

export function FieldLabel({ children, required = false }: FieldLabelProps) {
  return (
    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
      {children}{required && ' *'}
    </label>
  )
}

// Error message component
interface FieldErrorProps {
  error?: string
  show?: boolean
}

export function FieldError({ error, show = true }: FieldErrorProps) {
  if (!show || !error) return null
  return <p className="mt-1 text-xs text-red-500">{error}</p>
}

// Display value component (for view mode)
interface FieldValueProps {
  value?: string | number | null
  formatter?: (value: string | number) => string
}

export function FieldValue({ value, formatter }: FieldValueProps) {
  const displayValue = value != null && value !== ''
    ? (formatter ? formatter(value) : String(value))
    : '—'
  return <p className="text-sm text-slate-900 dark:text-white">{displayValue}</p>
}

// Text input field
interface TextFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  type?: 'text' | 'email' | 'tel' | 'date'
  placeholder?: string
  required?: boolean
  error?: string
  touched?: boolean
  disabled?: boolean
}

export function TextField({
  label,
  value,
  onChange,
  onBlur,
  type = 'text',
  placeholder,
  required = false,
  error,
  touched = false,
  disabled = false,
}: TextFieldProps) {
  const hasError = touched && !!error
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={FORM_FIELD_CLASSES.getValidatedClasses(hasError)}
      />
      <FieldError error={error} show={hasError} />
    </div>
  )
}

// Number input field
interface NumberFieldProps {
  label: string
  value: number | undefined
  onChange: (value: number) => void
  onBlur?: () => void
  placeholder?: string
  required?: boolean
  error?: string
  touched?: boolean
  min?: number
  max?: number
  disabled?: boolean
}

export function NumberField({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  error,
  touched = false,
  min,
  max,
  disabled = false,
}: NumberFieldProps) {
  const hasError = touched && !!error
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        type="number"
        value={value || ''}
        onChange={(e) => onChange(Number(e.target.value))}
        onBlur={onBlur}
        placeholder={placeholder}
        min={min}
        max={max}
        disabled={disabled}
        className={FORM_FIELD_CLASSES.getValidatedClasses(hasError)}
      />
      <FieldError error={error} show={hasError} />
    </div>
  )
}

// Select field
interface SelectOption {
  value: string
  label: string
}

interface SelectFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  options: SelectOption[]
  placeholder?: string
  required?: boolean
  error?: string
  touched?: boolean
  disabled?: boolean
}

export function SelectField({
  label,
  value,
  onChange,
  onBlur,
  options,
  placeholder,
  required = false,
  error,
  touched = false,
  disabled = false,
}: SelectFieldProps) {
  const hasError = touched && !!error
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        className={FORM_FIELD_CLASSES.getValidatedClasses(hasError)}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldError error={error} show={hasError} />
    </div>
  )
}

// Radio group field
interface RadioOption {
  value: string
  label: string
}

interface RadioGroupProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: RadioOption[]
  name: string
  required?: boolean
  columns?: 2 | 3 | 4
  disabled?: boolean
}

export function RadioGroup({
  label,
  value,
  onChange,
  options,
  name,
  required = false,
  columns = 2,
  disabled = false,
}: RadioGroupProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  }

  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <div className={`grid ${gridCols[columns]} gap-3`}>
        {options.map((option) => (
          <label key={option.value} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              className="text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

// Form row for side-by-side fields
interface FormRowProps {
  children: ReactNode
  columns?: 1 | 2 | 3
}

export function FormRow({ children, columns = 2 }: FormRowProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
  }

  return (
    <div className={`grid ${gridCols[columns]} gap-3`}>
      {children}
    </div>
  )
}

// Form section with header
interface FormSectionProps {
  title: string
  children: ReactNode
  className?: string
}

export function FormSection({ title, children, className = '' }: FormSectionProps) {
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </h3>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}

// Form footer with action buttons
interface FormFooterProps {
  onCancel: () => void
  submitLabel?: string
  cancelLabel?: string
  isSubmitting?: boolean
}

export function FormFooter({
  onCancel,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  isSubmitting = false,
}: FormFooterProps) {
  return (
    <div className="flex-shrink-0 px-6 py-4 bg-white dark:bg-slate-800">
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50"
        >
          {cancelLabel}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </div>
  )
}

// Editable field - shows view or edit mode
interface EditableFieldProps {
  label: string
  value: string | number | undefined
  isEditing: boolean
  onChange: (value: string) => void
  onBlur?: () => void
  type?: 'text' | 'email' | 'tel' | 'date' | 'number'
  placeholder?: string
  required?: boolean
  error?: string
  touched?: boolean
  displayFormatter?: (value: string | number) => string
  selectOptions?: SelectOption[]
}

export function EditableField({
  label,
  value,
  isEditing,
  onChange,
  onBlur,
  type = 'text',
  placeholder,
  required = false,
  error,
  touched = false,
  displayFormatter,
  selectOptions,
}: EditableFieldProps) {
  const hasError = touched && !!error

  if (!isEditing) {
    const displayValue = value != null && value !== ''
      ? (displayFormatter ? displayFormatter(value) : String(value))
      : '—'
    return (
      <div>
        <FieldLabel required={required}>{label}</FieldLabel>
        <p className="text-sm text-slate-900 dark:text-white">{displayValue}</p>
      </div>
    )
  }

  if (selectOptions) {
    return (
      <div>
        <FieldLabel required={required}>{label}</FieldLabel>
        <select
          value={String(value || '')}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className={FORM_FIELD_CLASSES.getValidatedClasses(hasError)}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {selectOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <FieldError error={error} show={hasError} />
      </div>
    )
  }

  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        className={FORM_FIELD_CLASSES.getValidatedClasses(hasError)}
      />
      <FieldError error={error} show={hasError} />
    </div>
  )
}
