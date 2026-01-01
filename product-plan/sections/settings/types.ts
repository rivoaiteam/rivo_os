// =============================================================================
// Data Types
// =============================================================================

export interface SettingsItem {
  id: string
  title: string
  description: string
  href: string
}

export interface SettingsCategory {
  id: string
  title: string
  items: SettingsItem[]
}

// =============================================================================
// Sources: Channels & Campaigns
// =============================================================================

// Channels are sources for Clients (Partner DSA, RMA, AskRivo, etc.)
export interface Channel {
  id: string
  name: string
  status: 'active'  // Always active
}

// Campaigns are sources for Leads (marketing campaigns)
export type CampaignStatus = 'incubation' | 'live' | 'pause'

export interface Campaign {
  id: string
  name: string
  status: CampaignStatus
  createdAt: string
}

// =============================================================================
// Component Props
// =============================================================================

export interface SettingsPageProps {
  categories: SettingsCategory[]
  onNavigate?: (href: string) => void
}

export interface ChannelsPageProps {
  channels: Channel[]
  onAddChannel?: (name: string) => void
  onEditChannel?: (id: string, name: string) => void
  onDeleteChannel?: (id: string) => void
}

export interface CampaignsPageProps {
  campaigns: Campaign[]
  onAddCampaign?: (name: string) => void
  onEditCampaign?: (id: string, name: string) => void
  onDeleteCampaign?: (id: string) => void
  onChangeStatus?: (id: string, status: CampaignStatus) => void
}

