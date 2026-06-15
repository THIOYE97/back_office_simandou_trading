import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';
import { colors } from '../theme';

interface Piece {
  id: string;
  typeDoc: string;
}
interface Detail {
  client: { id: string; telephone: string; type: string; statutKyc: string };
  statut: 'SOUMIS' | 'VALIDE' | 'REJETE' | 'INFOS_REQUISES';
  infos: Record<string, string>;
  pieces: Piece[];
  soumisAt: string;
}

const DOSSIER_STATUT: Record<string, { label: string; color: string }> = {
  SOUMIS: { label: 'En attente de vérification', color: colors.warning },
  VALIDE: { label: 'Dossier validé', color: colors.success },
  REJETE: { label: 'Dossier rejeté', color: colors.danger },
  INFOS_REQUISES: { label: 'Compléments demandés', color: colors.warning },
};

const FIELD_LABELS: Record<string, string> = {
  nom: 'Nom',
  prenom: 'Prénom',
  raisonSociale: 'Raison sociale',
  representant: 'Représentant',
  rccm: 'RCCM',
  adresse: 'Adresse',
  orangeMoneyCompte: 'Orange Money',
};

export function KycDetailPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [images, setImages] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'REJETER' | 'INFOS' | null>(null);
  const [motif, setMotif] = useState('');

  useEffect(() => {
    const urls: string[] = [];
    api.get<Detail>(`/admin/kyc/dossiers/${clientId}`).then(async (r) => {
      setDetail(r.data);
      for (const p of r.data.pieces) {
        const img = await api.get(`/admin/kyc/pieces/${p.id}`, { responseType: 'blob' });
        const url = URL.createObjectURL(img.data);
        urls.push(url);
        setImages((m) => ({ ...m, [p.id]: url }));
      }
    });
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [clientId]);

  const decide = async (decision: 'VALIDER' | 'REJETER' | 'INFOS') => {
    if ((decision === 'REJETER' || decision === 'INFOS') && !motif.trim()) {
      setMode(decision);
      return;
    }
    setBusy(true);
    try {
      await api.patch(`/clients/${clientId}/kyc`, { decision, motif: motif || undefined });
      navigate('/kyc');
    } catch {
      setBusy(false);
    }
  };

  if (!detail) return <div style={{ color: 'var(--text-muted)' }}>Chargement…</div>;

  return (
    <div style={{ maxWidth: 760 }}>
      <button className="btn btn-ghost" onClick={() => navigate('/kyc')} style={{ marginBottom: 20 }}>
        <ArrowLeft size={18} /> Retour
      </button>

      <div className="card" style={{ padding: 28, marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 20 }}>
          {detail.client.type === 'BUSINESS' ? 'Entreprise' : 'Particulier'} · {detail.client.telephone}
        </h2>
        <p style={{ color: 'var(--text-muted)', margin: '0 0 20px', fontSize: 13 }}>
          Soumis le {new Date(detail.soumisAt).toLocaleString('fr-FR')}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {Object.entries(detail.infos)
            .filter(([k]) => FIELD_LABELS[k] && k !== 'type')
            .map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  {FIELD_LABELS[k]}
                </div>
                <div style={{ fontWeight: 600, marginTop: 2 }}>{v || '—'}</div>
              </div>
            ))}
        </div>
      </div>

      <div className="card" style={{ padding: 28, marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Pièce d'identité</h3>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {detail.pieces.map((p) => (
            <div key={p.id}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                {p.typeDoc === 'PIECE_VERSO' ? 'Verso' : 'Recto'}
              </div>
              {images[p.id] ? (
                <img
                  src={images[p.id]}
                  alt={p.typeDoc}
                  style={{ width: 320, maxWidth: '100%', borderRadius: 12, border: `1px solid ${colors.border}` }}
                />
              ) : (
                <div style={{ width: 320, height: 200, background: colors.bg, borderRadius: 12 }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {detail.statut === 'SOUMIS' ? (
        <>
          {mode && (
            <div className="field">
              <label>Motif ({mode === 'REJETER' ? 'rejet' : 'compléments demandés'})</label>
              <input
                className="input"
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                placeholder="Précisez le motif…"
                autoFocus
              />
            </div>
          )}
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-success" disabled={busy} onClick={() => decide('VALIDER')}>
              <Check size={18} /> Valider
            </button>
            <button className="btn btn-warning" disabled={busy} onClick={() => decide('INFOS')}>
              <AlertCircle size={18} /> Demander des infos
            </button>
            <button className="btn btn-danger" disabled={busy} onClick={() => decide('REJETER')}>
              <X size={18} /> Rejeter
            </button>
          </div>
        </>
      ) : (
        <div
          className="badge"
          style={{
            color: DOSSIER_STATUT[detail.statut].color,
            borderColor: DOSSIER_STATUT[detail.statut].color + '55',
            background: DOSSIER_STATUT[detail.statut].color + '14',
            padding: '10px 16px',
            fontSize: 14,
          }}
        >
          {DOSSIER_STATUT[detail.statut].label}
        </div>
      )}
    </div>
  );
}
