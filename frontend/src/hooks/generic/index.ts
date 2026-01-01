/**
 * Generic Entity Hooks
 *
 * Reusable hooks across all entities (lead, client, case).
 * Same behavior = Same code.
 */

export { useLogCall } from './useLogCall'
export { useAddNote } from './useAddNote'
export { useUpdateStatus } from './useUpdateStatus'

// Types
export type { EntityType, LogCallInput, AddNoteInput, UpdateStatusInput } from './types'
export { ENTITY_QUERY_KEYS } from './types'
