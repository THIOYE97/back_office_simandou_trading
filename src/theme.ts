// Charte backoffice AYOUB — claire, brand blue, sidebar navy.
export const colors = {
  brand: '#1170E4',
  brandDark: '#0B5FD0',
  navy: '#0E1726',
  navy2: '#16223A',
  bg: '#F2F5F9',
  surface: '#FFFFFF',
  border: '#E4E9F1',
  text: '#0E1726',
  textSoft: '#5B6B82',
  textMuted: '#8A99AD',
  success: '#15B97D',
  warning: '#F59E0B',
  danger: '#E5484D',
  white: '#FFFFFF',
};

export const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  INSCRIT: { label: 'Inscrit', color: colors.textMuted },
  PENDING: { label: 'En vérification', color: colors.warning },
  INFOS_REQUISES: { label: 'Infos requises', color: colors.warning },
  REJETE: { label: 'Rejeté', color: colors.danger },
  VALIDE: { label: 'Validé', color: colors.success },
  SUSPENDU: { label: 'Suspendu', color: colors.danger },
  BLOQUE: { label: 'Bloqué', color: colors.danger },
};
