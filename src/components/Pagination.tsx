import { ChevronLeft, ChevronRight } from 'lucide-react';
import { colors } from '../theme';

export const PER_PAGE = 20;

interface Props {
  page: number;
  total: number;
  onPage: (p: number) => void;
}

// Pagination simple (20 par page). Affiche la plage courante + navigation.
export function Pagination({ page, total, onPage }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  if (total <= PER_PAGE) return null;

  const from = (page - 1) * PER_PAGE + 1;
  const to = Math.min(page * PER_PAGE, total);

  const btn = (disabled: boolean): React.CSSProperties => ({
    height: 34,
    padding: '0 10px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    opacity: disabled ? 0.4 : 1,
    cursor: disabled ? 'default' : 'pointer',
  });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 18px',
        borderTop: `1px solid ${colors.border}`,
      }}
    >
      <span style={{ color: 'var(--text-soft)', fontSize: 13 }}>
        {from}–{to} sur {total}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button className="btn btn-ghost" style={btn(page <= 1)} disabled={page <= 1} onClick={() => onPage(page - 1)}>
          <ChevronLeft size={16} /> Précédent
        </button>
        <span style={{ color: 'var(--text-soft)', fontSize: 13, minWidth: 70, textAlign: 'center' }}>
          Page {page} / {totalPages}
        </span>
        <button className="btn btn-ghost" style={btn(page >= totalPages)} disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
          Suivant <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
