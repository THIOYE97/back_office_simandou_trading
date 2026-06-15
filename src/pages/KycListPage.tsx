import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Inbox, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';
import { colors } from '../theme';

type DossierStatut = 'SOUMIS' | 'VALIDE' | 'REJETE' | 'INFOS_REQUISES';

interface Row {
  clientId: string;
  telephone: string;
  type: 'PARTICULIER' | 'BUSINESS';
  statut: DossierStatut;
  infos: Record<string, string>;
  soumisAt: string;
}

const STATUT: Record<DossierStatut, { label: string; color: string }> = {
  SOUMIS: { label: 'En attente', color: colors.warning },
  VALIDE: { label: 'Validé', color: colors.success },
  REJETE: { label: 'Rejeté', color: colors.danger },
  INFOS_REQUISES: { label: 'Infos requises', color: colors.warning },
};

const TABS: { key: string; label: string }[] = [
  { key: '', label: 'Tous' },
  { key: 'SOUMIS', label: 'En attente' },
  { key: 'VALIDE', label: 'Validés' },
  { key: 'REJETE', label: 'Rejetés' },
  { key: 'INFOS_REQUISES', label: 'Infos requises' },
];

const nameOf = (r: Row) =>
  r.type === 'BUSINESS' ? r.infos?.raisonSociale : `${r.infos?.nom ?? ''} ${r.infos?.prenom ?? ''}`.trim();

export function KycListPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('');
  const navigate = useNavigate();

  const load = useCallback((statut: string) => {
    setLoading(true);
    api
      .get<Row[]>('/admin/kyc/dossiers', { params: statut ? { statut } : {} })
      .then((r) => setRows(r.data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load(tab);
  }, [tab, load]);

  return (
    <div>
      <h1 style={{ fontSize: 26, margin: '0 0 4px' }}>Dossiers KYC</h1>
      <p style={{ color: 'var(--text-soft)', margin: '0 0 20px' }}>
        Tous les dossiers — en attente, validés et rejetés.
      </p>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="btn"
              style={{
                height: 36,
                padding: '0 14px',
                fontSize: 13,
                background: active ? colors.brand : '#fff',
                color: active ? '#fff' : 'var(--text-soft)',
                border: `1px solid ${active ? colors.brand : 'var(--border)'}`,
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Chargement…</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 56, textAlign: 'center', color: 'var(--text-muted)' }}>
            <Inbox size={40} style={{ opacity: 0.5 }} />
            <p style={{ marginTop: 12 }}>Aucun dossier dans cette catégorie.</p>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Client</th>
                <th>Téléphone</th>
                <th>Type</th>
                <th>Statut</th>
                <th>Soumis le</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const s = STATUT[r.statut];
                return (
                  <tr key={r.clientId} onClick={() => navigate(`/kyc/${r.clientId}`)}>
                    <td style={{ fontWeight: 600 }}>{nameOf(r) || '—'}</td>
                    <td>{r.telephone}</td>
                    <td>{r.type === 'BUSINESS' ? 'Entreprise' : 'Particulier'}</td>
                    <td>
                      <span
                        className="badge"
                        style={{ color: s.color, borderColor: s.color + '55', background: s.color + '14' }}
                      >
                        {s.label}
                      </span>
                    </td>
                    <td>{new Date(r.soumisAt).toLocaleString('fr-FR')}</td>
                    <td style={{ textAlign: 'right', color: 'var(--brand)' }}>
                      <ChevronRight size={18} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
