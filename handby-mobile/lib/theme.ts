// Design tokens — "Trust & Speed" visual refresh
export const colors = {
  primary:       '#1E40AF',
  primaryLight:  '#3B82F6',
  primaryBg:     '#EFF6FF',
  primarySubtle: '#DBEAFE',
  cta:           '#F97316',
  ctaPressed:    '#EA580C',
  ctaDisabled:   '#FDBA74',
  textPrimary:   '#1E3A8A',
  textBody:      '#475569',
  textMuted:     '#94A3B8',
  surface:       '#FFFFFF',
  border:        '#E0E7FF',
  success:       '#16A34A',
  warning:       '#D97706',
  error:         '#DC2626',
  star:          '#FACC15',
} as const

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const

export const shadow = {
  card: {
    shadowColor: '#1E40AF',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  cardRaised: {
    shadowColor: '#1E40AF',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },
} as const
