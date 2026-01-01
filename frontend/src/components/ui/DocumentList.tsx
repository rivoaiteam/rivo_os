/**
 * Reusable Document List Component
 * Used by both ClientSidePanel (for documents) and CaseSidePanel (for bank forms)
 */

import { Eye, CheckCircle, Trash2 } from 'lucide-react'

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
  getFilenameFromUrl?: (url: string) => string
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
  getFilenameFromUrl = defaultGetFilename,
}: DocumentListProps) {
  return (
    <div className="space-y-2">
      {documents.map((doc) => {
        const displayName = doc.type === 'other' && doc.fileUrl
          ? getFilenameFromUrl(doc.fileUrl)
          : labels[doc.type] || doc.type

        return (
          <div
            key={doc.id}
            className={`flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg ${
              doc.fileUrl && onPreview ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700' : ''
            }`}
            onClick={() => {
              if (doc.fileUrl && onPreview) {
                onPreview(doc)
              }
            }}
          >
            <div className="flex items-center gap-2">
              {doc.fileUrl && <Eye className="w-4 h-4 text-slate-400" />}
              <p className="text-sm font-medium text-slate-900 dark:text-white">
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
              ) : (
                <span className="text-xs text-slate-400">Not uploaded</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
