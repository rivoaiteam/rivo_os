/**
 * Reusable Document List Component
 * Used by both ClientSidePanel (for documents) and CaseSidePanel (for bank forms)
 */

import { useRef } from 'react'
import { Eye, CheckCircle, Trash2, Upload } from 'lucide-react'

export interface DocumentItem {
  id: number
  type: string
  fileUrl?: string
  status: string
}

interface DocumentListProps {
  documents: DocumentItem[]
  labels: Record<string, string>
  onPreview?: (doc: DocumentItem) => void
  onDelete?: (docId: number) => void
  onUpload?: (type: string, file: File) => void
  getFilenameFromUrl?: (url: string) => string
  allowUpload?: boolean
}

// Default filename extractor
const defaultGetFilename = (url: string): string => {
  try {
    const pathname = new URL(url).pathname
    let filename = pathname.split('/').pop() || 'Other Document'
    filename = decodeURIComponent(filename)
    // Strip UUID prefix if present (format: xxxxxxxx_filename.ext)
    const uuidPrefixMatch = filename.match(/^[a-f0-9]{8}_(.+)$/i)
    if (uuidPrefixMatch) {
      filename = uuidPrefixMatch[1]
    }
    return filename
  } catch {
    return 'Other Document'
  }
}

export function DocumentList({
  documents,
  labels,
  onPreview,
  onDelete,
  onUpload,
  getFilenameFromUrl = defaultGetFilename,
  allowUpload = false,
}: DocumentListProps) {
  // Filter out 'other' type documents for upload list - we only show specific types
  const specificDocuments = documents.filter(doc => doc.type !== 'other')
  const otherDocuments = documents.filter(doc => doc.type === 'other' && doc.fileUrl)

  return (
    <div className="space-y-2">
      {specificDocuments.map((doc) => (
        <DocumentRow
          key={doc.id}
          doc={doc}
          displayName={labels[doc.type] || doc.type}
          onPreview={onPreview}
          onDelete={onDelete}
          onUpload={onUpload}
          allowUpload={allowUpload}
        />
      ))}
      {otherDocuments.map((doc) => (
        <DocumentRow
          key={doc.id}
          doc={doc}
          displayName={doc.fileUrl ? getFilenameFromUrl(doc.fileUrl) : 'Other Document'}
          onPreview={onPreview}
          onDelete={onDelete}
          allowUpload={false}
        />
      ))}
    </div>
  )
}

interface DocumentRowProps {
  doc: DocumentItem
  displayName: string
  onPreview?: (doc: DocumentItem) => void
  onDelete?: (docId: number) => void
  onUpload?: (type: string, file: File) => void
  allowUpload?: boolean
}

function DocumentRow({ doc, displayName, onPreview, onDelete, onUpload, allowUpload = false }: DocumentRowProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUploadClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onUpload) {
      onUpload(doc.type, file)
    }
    e.target.value = ''
  }

  return (
    <div
      className={`flex items-center justify-between p-3 bg-slate-50 rounded-lg ${
        doc.fileUrl && onPreview ? 'cursor-pointer hover:bg-slate-100' : ''
      }`}
      onClick={() => {
        if (doc.fileUrl && onPreview) {
          onPreview(doc)
        }
      }}
    >
      <div className="flex items-center gap-2">
        {doc.fileUrl && <Eye className="w-4 h-4 text-slate-400" />}
        <p className="text-sm font-medium text-slate-900">
          {displayName}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {doc.fileUrl ? (
          <>
            <CheckCircle className="w-4 h-4 text-green-500" />
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(doc.id)
                }}
                className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                title="Delete document"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </>
        ) : allowUpload && onUpload ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              onClick={handleUploadClick}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
              title={`Upload ${displayName}`}
            >
              <Upload className="w-3 h-3" />
              Upload
            </button>
          </>
        ) : (
          <span className="text-xs text-slate-400">Not uploaded</span>
        )}
      </div>
    </div>
  )
}
