import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, AlertCircle, User, Building2, Phone } from 'lucide-react';
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

  const isBusiness = detail.client.type === 'BUSINESS';
  const st = DOSSIER_STATUT[detail.statut];
  const nom = isBusiness
    ? detail.infos.raisonSociale
    : `${detail.infos.nom ?? ''} ${detail.infos.prenom ?? ''}`.trim();

  return (
    <div style={{ maxWidth: 820 }}>
      <button className="btn btn-ghost" onClick={() => navigate('/kyc')} style={{ marginBottom: 20 }}>
        <ArrowLeft size={18} /> Dossiers KYC
      </button>

      {/* En-tête identité */}
      <div className="card" style={{ padding: 28, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: colors.brand + '14',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isBusiness ? <Building2 size={26} color={colors.brand} /> : <User size={26} color={colors.brand} />}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 21 }}>{nom || (isBusiness ? 'Entreprise' : 'Particulier')}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13.5, marginTop: 3 }}>
                <Phone size={14} /> {detail.client.telephone}
                <span style={{ margin: '0 4px' }}>·</span>
                {isBusiness ? 'Entreprise' : 'Particulier'}
              </div>
            </div>
          </div>
          <span
            className="badge"
            style={{ color: st.color, borderColor: st.color + '55', background: st.color + '14', padding: '8px 14px', fontSize: 13.5 }}
          >
            {st.label}
          </span>
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: 12.5, marginTop: 16 }}>
          Soumis le {new Date(detail.soumisAt).toLocaleString('fr-FR')}
        </div>
      </div>

      {/* Informations */}
      <div className="card" style={{ padding: 28, marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 18px', fontSize: 16 }}>Informations</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          {Object.entries(detail.infos)
            .filter(([k]) => FIELD_LABELS[k] && k !== 'type')
            .map(([k, v]) => (
              <div key={k} style={{ borderLeft: `2px solid ${colors.border}`, paddingLeft: 12 }}>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                  {FIELD_LABELS[k]}
                </div>
                <div style={{ fontWeight: 600, marginTop: 3 }}>{v || '—'}</div>
              </div>
            ))}
        </div>
      </div>

      {/* Pièce d'identité */}
      <div className="card" style={{ padding: 28, marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Pièce d'identité</h3>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          {detail.pieces.map((p) => (
            <div key={p.id}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>
                {p.typeDoc === 'PIECE_VERSO' ? 'Verso' : 'Recto'}
              </div>
              {images[p.id] ? (
                <img
                  src={images[p.id]}
                  alt={p.typeDoc}
                  style={{ width: 320, maxWidth: '100%', borderRadius: 12, border: `1px solid ${colors.border}`, display: 'block' }}
                />
              ) : (
                <div style={{ width: 320, height: 200, background: colors.bg, borderRadius: 12 }} />
              )}
            </div>
          ))}
          {detail.pieces.length === 0 && <div style={{ color: 'var(--text-muted)' }}>Aucune pièce jointe.</div>}
        </div>
      </div>

      {/* Décision */}
      {detail.statut === 'SOUMIS' ? (
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Décision</h3>
          {mode && (
            <div className="field">
              <label>Motif ({mode === 'REJETER' ? 'rejet' : 'compléments demandés'})</label>
              <input
                className="input"
                style={{ width: '100%', boxSizing: 'border-box' }}
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                placeholder="Précisez le motif…"
                autoFocus
              />
            </div>
          )}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
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
        </div>
      ) : (
        <div
          className="badge"
          style={{
            color: st.color,
            borderColor: st.color + '55',
            background: st.color + '14',
            padding: '12px 18px',
            fontSize: 14,
          }}
        >
          {st.label}
        </div>
      )}
    </div>
  );
}
