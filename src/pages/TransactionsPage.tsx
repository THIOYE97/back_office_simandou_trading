import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { colors } from '../theme';

type Statut =
  | 'INITIEE'
  | 'CONTACT_ETABLI'
  | 'JAMBES_EN_COURS'
  | 'COMPLETEE'
  | 'ANNULEE'
  | 'LITIGE';

interface Tx {
  id: string;
  devise: string;
  sens: 'ACHAT' | 'VENTE';
  montantDevise: string;
  montantGnf: string;
  statut: Statut;
  createdAt: string;
  client: { telephone: string };
}

const STATUT: Record<Statut, { label: string; color: string }> = {
  INITIEE: { label: 'Initiée', color: colors.brand },
  CONTACT_ETABLI: { label: 'Contact établi', color: colors.warning },
  JAMBES_EN_COURS: { label: 'En cours', color: colors.warning },
  COMPLETEE: { label: 'Complétée', color: colors.success },
  ANNULEE: { label: 'Annulée', color: colors.danger },
  LITIGE: { label: 'Litige', color: colors.danger },
};

// Actions disponibles selon le statut courant.
const ACTIONS: Record<Statut, { action: string; label: string; kind: string }[]> = {
  INITIEE: [
    { action: 'CONTACT', label: 'Contact établi', kind: 'btn-primary' },
    { action: 'ANNULER', label: 'Annuler', kind: 'btn-ghost' },
  ],
  CONTACT_ETABLI: [
    { action: 'JAMBES', label: 'Échange en cours', kind: 'btn-primary' },
    { action: 'ANNULER', label: 'Annuler', kind: 'btn-ghost' },
  ],
  JAMBES_EN_COURS: [
    { action: 'COMPLETER', label: 'Clôturer', kind: 'btn-success' },
    { action: 'LITIGE', label: 'Litige', kind: 'btn-warning' },
  ],
  LITIGE: [
    { action: 'COMPLETER', label: 'Clôturer', kind: 'btn-success' },
    { action: 'ANNULER', label: 'Annuler', kind: 'btn-ghost' },
  ],
  COMPLETEE: [],
  ANNULEE: [],
};

export function TransactionsPage() {
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () =>
    api.get<Tx[]>('/admin/transactions').then((r) => setTxs(r.data)).finally(() => setLoading(false));
  useEffect(() => {
    load();
  }, []);

  const act = async (tx: Tx, action: string) => {
    let commentaire: string | undefined;
    if (action === 'ANNULER' || action === 'LITIGE') {
      commentaire = window.prompt('Motif :') ?? undefined;
      if (commentaire === undefined) return;
    }
    setBusy(tx.id);
    try {
      await api.patch(`/admin/transactions/${tx.id}`, { action, commentaire });
      await load();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: 26, margin: '0 0 4px' }}>Transactions</h1>
      <p style={{ color: 'var(--text-soft)', margin: '0 0 24px' }}>
        Suivi et avancement des opérations d'échange.
      </p>

      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Chargement…</div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Client</th>
                <th>Sens</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {txs.map((t) => {
                const s = STATUT[t.statut];
                return (
                  <tr key={t.id} style={{ cursor: 'default' }}>
                    <td>{t.client.telephone}</td>
                    <td>
                      {t.sens === 'VENTE' ? 'Vente' : 'Achat'} {t.devise}
                    </td>
                    <td>
                      {Number(t.montantDevise).toLocaleString('fr-FR')} {t.devise}
                      <span style={{ color: 'var(--text-muted)' }}>
                        {' '}
                        · {Number(t.montantGnf).toLocaleString('fr-FR')} GNF
                      </span>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{ color: s.color, borderColor: s.color + '55', background: s.color + '14' }}
                      >
                        {s.label}
                      </span>
                    </td>
                    <td>{new Date(t.createdAt).toLocaleString('fr-FR')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        {ACTIONS[t.statut].map((a) => (
                          <button
                            key={a.action}
                            className={`btn ${a.kind}`}
                            style={{ height: 34, padding: '0 12px', fontSize: 13 }}
                            disabled={busy === t.id}
                            onClick={() => act(t, a.action)}
                          >
                            {a.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {txs.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
                    Aucune transaction.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
