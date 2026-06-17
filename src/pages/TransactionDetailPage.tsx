import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Check, AlertTriangle, X } from 'lucide-react';
import { api } from '../lib/api';
import { colors } from '../theme';

type Statut = 'INITIEE' | 'CONTACT_ETABLI' | 'JAMBES_EN_COURS' | 'COMPLETEE' | 'ANNULEE' | 'LITIGE';

interface Ev {
  statut: Statut;
  commentaire: string | null;
  at: string;
}
interface Detail {
  id: string;
  devise: 'USD' | 'EUR' | 'XOF';
  sens: 'ACHAT' | 'VENTE';
  montantDevise: string;
  montantGnf: string;
  tauxFige: string;
  statut: Statut;
  createdAt: string;
  motifAnnulation: string | null;
  client: { telephone: string; type: string; nom: string | null; prenom: string | null };
  offre: { vendeurNom: string | null } | null;
  events: Ev[];
}

const DEVISE_LABEL: Record<string, string> = { USD: 'Dollar', EUR: 'Euro', XOF: 'FCFA' };
const STATUT: Record<Statut, { label: string; color: string }> = {
  INITIEE: { label: 'Initiée', color: colors.brand },
  CONTACT_ETABLI: { label: 'Contact établi', color: colors.warning },
  JAMBES_EN_COURS: { label: 'Échange en cours', color: colors.warning },
  COMPLETEE: { label: 'Complétée', color: colors.success },
  ANNULEE: { label: 'Annulée', color: colors.danger },
  LITIGE: { label: 'Litige', color: colors.danger },
};

const ACTIONS: Record<Statut, { action: string; label: string; kind: string; motif?: boolean }[]> = {
  INITIEE: [
    { action: 'CONTACT', label: 'Contact établi', kind: 'btn-primary' },
    { action: 'ANNULER', label: 'Annuler', kind: 'btn-danger', motif: true },
  ],
  CONTACT_ETABLI: [
    { action: 'JAMBES', label: 'Échange en cours', kind: 'btn-primary' },
    { action: 'ANNULER', label: 'Annuler', kind: 'btn-danger', motif: true },
  ],
  JAMBES_EN_COURS: [
    { action: 'COMPLETER', label: 'Clôturer', kind: 'btn-success' },
    { action: 'LITIGE', label: 'Signaler un litige', kind: 'btn-warning', motif: true },
  ],
  LITIGE: [
    { action: 'COMPLETER', label: 'Clôturer', kind: 'btn-success' },
    { action: 'ANNULER', label: 'Annuler', kind: 'btn-danger', motif: true },
  ],
  COMPLETEE: [],
  ANNULEE: [],
};

export function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tx, setTx] = useState<Detail | null>(null);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<{ action: string; label: string } | null>(null);
  const [motif, setMotif] = useState('');

  const load = useCallback(() => {
    api.get<Detail>(`/admin/transactions/${id}`).then((r) => setTx(r.data));
  }, [id]);
  useEffect(() => {
    load();
  }, [load]);

  const run = async (action: string, commentaire?: string) => {
    setBusy(true);
    try {
      await api.patch(`/admin/transactions/${id}`, { action, commentaire });
      setPending(null);
      setMotif('');
      load();
    } finally {
      setBusy(false);
    }
  };

  const onAction = (a: { action: string; label: string; motif?: boolean }) => {
    if (a.motif) setPending({ action: a.action, label: a.label });
    else run(a.action);
  };

  if (!tx) return <div style={{ color: 'var(--text-muted)' }}>Chargement…</div>;

  const s = STATUT[tx.statut];
  const isVente = tx.sens === 'VENTE';
  const dl = DEVISE_LABEL[tx.devise] ?? tx.devise;
  const nomClient = `${tx.client.nom ?? ''} ${tx.client.prenom ?? ''}`.trim();

  const Field = ({ label, value, strong }: { label: string; value: string; strong?: boolean }) => (
    <div>
      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
      <div style={{ fontWeight: strong ? 700 : 600, marginTop: 3, fontSize: strong ? 16 : 14, color: strong ? colors.brand : colors.text }}>
        {value}
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 820 }}>
      <button className="btn btn-ghost" onClick={() => navigate('/transactions')} style={{ marginBottom: 20 }}>
        <ArrowLeft size={18} /> Transactions
      </button>

      {/* Récapitulatif */}
      <div className="card" style={{ padding: 28, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: (isVente ? colors.success : colors.brand) + '16',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isVente ? <ArrowUpRight size={24} color={colors.success} /> : <ArrowDownLeft size={24} color={colors.brand} />}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 20 }}>
                {isVente ? 'Vente' : 'Achat'} {dl}
              </h2>
              <div style={{ color: colors.text, fontSize: 14, fontWeight: 600, marginTop: 2 }}>
                {nomClient || (tx.client.type === 'BUSINESS' ? 'Entreprise' : 'Client')}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{tx.client.telephone}</div>
            </div>
          </div>
          <span
            className="badge"
            style={{ color: s.color, borderColor: s.color + '55', background: s.color + '14', padding: '8px 14px', fontSize: 13.5 }}
          >
            {s.label}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          <Field label={`Montant ${dl}`} value={`${Number(tx.montantDevise).toLocaleString('fr-FR')} ${dl}`} />
          <Field label="Montant GNF" value={`${Number(tx.montantGnf).toLocaleString('fr-FR')} GNF`} strong />
          <Field label="Taux figé" value={`${Number(tx.tauxFige).toLocaleString('fr-FR')} GNF`} />
          <Field label="Client" value={tx.client.type === 'BUSINESS' ? 'Entreprise' : 'Particulier'} />
          <Field label="Vendeur (interne)" value={tx.offre?.vendeurNom || '—'} />
          <Field label="Initiée le" value={new Date(tx.createdAt).toLocaleString('fr-FR')} />
        </div>

        {tx.motifAnnulation && (
          <div
            style={{
              marginTop: 20,
              padding: '12px 16px',
              borderRadius: 12,
              background: colors.danger + '10',
              border: `1px solid ${colors.danger}33`,
              color: colors.danger,
              fontSize: 13.5,
            }}
          >
            Motif d'annulation : {tx.motifAnnulation}
          </div>
        )}
      </div>

      {/* Actions */}
      {ACTIONS[tx.statut].length > 0 && (
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: 'var(--text-soft)', marginBottom: 12, fontWeight: 600 }}>Faire avancer l'opération</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {ACTIONS[tx.statut].map((a) => (
              <button key={a.action} className={`btn ${a.kind}`} disabled={busy} onClick={() => onAction(a)}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Historique */}
      <div className="card" style={{ padding: 28 }}>
        <h3 style={{ margin: '0 0 20px', fontSize: 16 }}>Historique</h3>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {tx.events.map((e, i) => {
            const es = STATUT[e.statut];
            const last = i === tx.events.length - 1;
            return (
              <div key={i} style={{ display: 'flex', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 12, height: 12, borderRadius: 6, background: es.color, marginTop: 4 }} />
                  {!last && <div style={{ width: 2, flex: 1, background: colors.border, marginTop: 4 }} />}
                </div>
                <div style={{ paddingBottom: last ? 0 : 22 }}>
                  <div style={{ fontWeight: 600, color: es.color }}>{es.label}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
                    {new Date(e.at).toLocaleString('fr-FR')}
                  </div>
                  {e.commentaire && (
                    <div style={{ fontSize: 13, color: 'var(--text-soft)', marginTop: 4 }}>« {e.commentaire} »</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal motif (annulation / litige) */}
      {pending && (
        <div
          onClick={() => !busy && setPending(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(14,23,38,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}
        >
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: '100%', maxWidth: 420, padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h2 style={{ fontSize: 19, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                {pending.action === 'LITIGE' ? <AlertTriangle size={20} color={colors.warning} /> : <X size={20} color={colors.danger} />}
                {pending.label}
              </h2>
              <button className="btn btn-ghost" style={{ height: 34, padding: '0 8px' }} onClick={() => setPending(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="field">
              <label>Motif</label>
              <input className="input" style={{ width: '100%', boxSizing: 'border-box' }} value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Précisez le motif…" autoFocus />
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setPending(null)} disabled={busy}>
                Annuler
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={busy || !motif.trim()}
                onClick={() => run(pending.action, motif.trim())}
              >
                <Check size={18} /> Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
