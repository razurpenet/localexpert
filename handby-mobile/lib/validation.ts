// Input validation & sanitization utilities

/** Strip HTML tags to prevent stored XSS */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '')
}

/** Sanitize and trim text input — strips HTML, enforces max length */
export function sanitize(input: string, maxLength = 500): string {
  return stripHtml(input).trim().slice(0, maxLength)
}

/** Validate UK postcode format */
export function isValidUkPostcode(postcode: string): boolean {
  return /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i.test(postcode.trim())
}

/** Validate UK phone number (07xxx or +44 format, 10-15 digits) */
export function isValidUkPhone(phone: string): boolean {
  const digits = phone.replace(/[\s\-\(\)\+]/g, '')
  return /^\d{10,15}$/.test(digits)
}

/** Validate email format */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

/** Validate password strength: min 8 chars, at least 1 uppercase, 1 lowercase, 1 digit */
export function validatePassword(password: string): { valid: boolean; message: string } {
  if (password.length < 8) return { valid: false, message: 'Password must be at least 8 characters' }
  if (!/[A-Z]/.test(password)) return { valid: false, message: 'Password needs at least one uppercase letter' }
  if (!/[a-z]/.test(password)) return { valid: false, message: 'Password needs at least one lowercase letter' }
  if (!/\d/.test(password)) return { valid: false, message: 'Password needs at least one number' }
  return { valid: true, message: '' }
}

/** Validate numeric range */
export function isInRange(value: number, min: number, max: number): boolean {
  return !isNaN(value) && value >= min && value <= max
}

/** Validate UUID format */
export function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

/** Allowed image extensions for uploads */
const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic']

/** Allowed document extensions (for credentials) */
const ALLOWED_DOC_EXTENSIONS = [...ALLOWED_IMAGE_EXTENSIONS, 'pdf']

/** Get file extension from URI or MIME type, lowercased */
export function getFileExtension(uri: string, mimeType?: string | null): string {
  // Prefer deriving from MIME type (iOS URIs often lack extensions)
  if (mimeType) {
    const mimeMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/heic': 'heic',
      'image/heif': 'heic',
      'application/pdf': 'pdf',
    }
    const ext = mimeMap[mimeType.toLowerCase()]
    if (ext) return ext
  }
  // Fallback to URI extension
  return (uri.split('.').pop() ?? '').toLowerCase()
}

/** Check if extension is an allowed image type */
export function isAllowedImage(uri: string, mimeType?: string | null): boolean {
  return ALLOWED_IMAGE_EXTENSIONS.includes(getFileExtension(uri, mimeType))
}

/** Check if extension is an allowed document type (images + PDF) */
export function isAllowedDocument(uri: string, mimeType?: string | null): boolean {
  return ALLOWED_DOC_EXTENSIONS.includes(getFileExtension(uri, mimeType))
}

/** Get MIME type from extension */
export function getMimeType(ext: string): string {
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    heic: 'image/heic',
    pdf: 'application/pdf',
  }
  return map[ext.toLowerCase()] ?? 'application/octet-stream'
}

/** Generic user-friendly error message (hides internal details) */
export function userFriendlyError(context: string): string {
  return `Something went wrong while ${context}. Please try again.`
}
