export type UserRole = 'customer' | 'provider'
export type PriceType = 'fixed' | 'hourly' | 'quote'
export type RequestStatus = 'pending' | 'accepted' | 'declined' | 'completed'

export interface Profile {
  id: string
  role: UserRole
  full_name: string
  avatar_url: string | null
  phone: string | null
  city: string | null
  postcode: string | null
  bio: string | null
  lat: number | null
  lng: number | null
  created_at: string
}

export interface ProviderDetails {
  id: string
  business_name: string
  is_available: boolean
  years_exp: number | null
  website_url: string | null
  avg_rating: number
  review_count: number
  is_verified: boolean
}

export interface Category {
  id: number
  name: string
  slug: string
  icon: string | null
}

export interface Service {
  id: string
  provider_id: string
  category_id: number
  title: string
  description: string | null
  price_from: number | null
  price_type: PriceType | null
  is_active: boolean
  categories?: { name: string }
}

export interface QuoteRequest {
  id: string
  customer_id: string
  provider_id: string
  service_id: string | null
  message: string
  status: RequestStatus
  created_at: string
}

export interface Review {
  id: string
  request_id: string
  reviewer_id: string
  provider_id: string
  rating: number
  body: string | null
  punctuality: number | null
  quality: number | null
  value: number | null
  created_at: string
}

export interface ProviderCardData {
  id: string
  full_name: string
  avatar_url: string | null
  city: string | null
  provider_details: ProviderDetails | null
  primary_category?: string | null
  distance_km?: number | null
  min_price?: number | null
}

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected'
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled'
export type CredentialType = 'certification' | 'insurance' | 'license' | 'other'
export type JobPhotoType = 'before' | 'after'

export interface Quote {
  id: string
  request_id: string
  provider_id: string
  customer_id: string
  items: { description: string; amount: number }[]
  subtotal: number
  vat_rate: number
  vat_amount: number
  discount: number
  total: number
  notes: string | null
  status: QuoteStatus
  created_at: string
}

export interface Appointment {
  id: string
  request_id: string
  provider_id: string
  customer_id: string
  date: string
  time_slot: string
  notes: string | null
  status: AppointmentStatus
  created_at: string
}

export interface Credential {
  id: string
  provider_id: string
  type: CredentialType
  label: string
  document_url: string
  verified: boolean
  expires_at: string | null
  created_at: string
}

export interface JobPhoto {
  id: string
  request_id: string
  provider_id: string
  image_url: string
  type: JobPhotoType
  created_at: string
}

export interface Favourite {
  id: string
  customer_id: string
  provider_id: string
  created_at: string
}

export interface PortfolioItem {
  id: string
  provider_id: string
  image_url: string
  caption: string | null
  album: string | null
  created_at: string
}
