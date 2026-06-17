import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { api } from '../lib/api';
import { colors } from '../theme';
import { Pagination, PER_PAGE } from '../components/Pagination';

type Statut = 'INITIEE' | 'CONTACT_ETABLI' | 'JAMBES_EN_COURS' | 'COMPLETEE' | 'ANNULEE' | 'LITIGE';

interface Tx {
  id: string;
  devise: string;
  sens: 'ACHAT' | 'VENTE';
  montantDevise: string;
  montantGnf: string;
  statut: Statut;
  createdAt: string;
  client: { telephone: string; type: string; nom: string | null; prenom: string | null };
}

const nomClient = (c: Tx['client']): string =>
  `${c.nom ?? ''} ${c.prenom ?? ''}`.trim() || '—';

const DEVISE_LABEL: Record<string, string> = { USD: 'Dollar', EUR: 'Euro', XOF: 'FCFA' };
const STATUT: Record<Statut, { label: string; color: string }> = {
  INITIEE: { label: 'Initiée', color: colors.brand },
  CONTACT_ETABLI: { label: 'Contact établi', color: colors.warning },
  JAMBES_EN_COURS: { label: 'En cours', color: colors.warning },
  COMPLETEE: { label: 'Complétée', color: colors.success },
  ANNULEE: { label: 'Annulée', color: colors.danger },
  LITIGE: { label: 'Litige', color: colors.danger },
};

const TABS: { key: string; label: string }[] = [
  { key: '', label: 'Toutes' },
  { key: 'INITIEE', label: 'Initiées' },
  { key: 'CONTACT_ETABLI', label: 'Contact établi' },
  { key: 'JAMBES_EN_COURS', label: 'En cours' },
  { key: 'COMPLETEE', label: 'Complétées' },
  { key: 'LITIGE', label: 'Litiges' },
  { key: 'ANNULEE', label: 'Annulées' },
];

export function TransactionsPage() {
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const paged = txs.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const load = useCallback((statut: string) => {
    setLoading(true);
    api
      .get<Tx[]>('/admin/transactions', { params: statut ? { statut } : {} })
      .then((r) => setTxs(r.data))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    load(tab);
  }, [tab, load]);

  return (
    <div>
      <h1 style={{ fontSize: 26, margin: '0 0 4px' }}>Transactions</h1>
      <p style={{ color: 'var(--text-soft)', margin: '0 0 20px' }}>
        Suivi et avancement des opérations d'échange. Cliquez une ligne pour le détail.
      </p>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                setPage(1);
              }}
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
        ) : txs.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Aucune transaction dans cette catégorie.</div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Sens</th>
                <th>Client</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Date</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {paged.map((t) => {
                const s = STATUT[t.statut];
                const isVente = t.sens === 'VENTE';
                const dl = DEVISE_LABEL[t.devise] ?? t.devise;
                return (
                  <tr key={t.id} onClick={() => navigate(`/transactions/${t.id}`)}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600 }}>
                        <span
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 9,
                            background: (isVente ? colors.success : colors.brand) + '16',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isVente ? <ArrowUpRight size={16} color={colors.success} /> : <ArrowDownLeft size={16} color={colors.brand} />}
                        </span>
                        {isVente ? 'Vente' : 'Achat'} {dl}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{nomClient(t.client)}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>{t.client.telephone}</div>
                    </td>
                    <td>
                      {Number(t.montantDevise).toLocaleString('fr-FR')} {dl}
                      <span style={{ color: 'var(--text-muted)' }}> · {Number(t.montantGnf).toLocaleString('fr-FR')} GNF</span>
                    </td>
                    <td>
                      <span className="badge" style={{ color: s.color, borderColor: s.color + '55', background: s.color + '14' }}>
                        {s.label}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-soft)', fontSize: 13 }}>{new Date(t.createdAt).toLocaleString('fr-FR')}</td>
                    <td style={{ textAlign: 'right', color: 'var(--brand)' }}>
                      <ChevronRight size={18} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {!loading && txs.length > 0 && <Pagination page={page} total={txs.length} onPage={setPage} />}
      </div>
    </div>
  );
}
