import { useEffect, useState } from 'react';
import { Save, Plus, Pencil, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { api } from '../lib/api';
import { colors } from '../theme';

interface Offre {
  id: string;
  devise: 'USD' | 'EUR' | 'XOF';
  tauxAchat: string;
  tauxVente: string;
  vendeurNom: string | null;
  statut: 'BROUILLON' | 'ACTIVE' | 'INACTIVE';
  majAt: string;
}

const DEVISES = ['USD', 'EUR', 'XOF'] as const;
const LABELS: Record<string, string> = { USD: 'Dollar', EUR: 'Euro', XOF: 'FCFA' };

export function OffersPage() {
  const [offres, setOffres] = useState<Offre[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  // Pop-up de modification
  const [editing, setEditing] = useState<Offre | null>(null);
  const [achat, setAchat] = useState('');
  const [vente, setVente] = useState('');
  const [vendeur, setVendeur] = useState('');
  const [saving, setSaving] = useState('');
  const [formErr, setFormErr] = useState<string | null>(null);

  // Création d'une devise non encore publiée
  const [createOpen, setCreateOpen] = useState(false);
  const [newDevise, setNewDevise] = useState<(typeof DEVISES)[number]>('USD');

  const load = () => api.get<Offre[]>('/admin/offres').then((r) => setOffres(r.data));
  useEffect(() => {
    load();
  }, []);

  const openEdit = (o: Offre) => {
    setEditing(o);
    setAchat(String(o.tauxAchat));
    setVente(String(o.tauxVente));
    setVendeur(o.vendeurNom ?? '');
    setFormErr(null);
  };

  const manquantes = DEVISES.filter((d) => !offres.some((o) => o.devise === d));

  const openCreate = () => {
    setEditing(null);
    setNewDevise(manquantes[0] ?? 'USD');
    setAchat('');
    setVente('');
    setVendeur('');
    setFormErr(null);
    setCreateOpen(true);
  };

  const close = () => {
    setEditing(null);
    setCreateOpen(false);
  };

  const save = async () => {
    const tauxAchat = Number(achat);
    const tauxVente = Number(vente);
    if (!(tauxAchat > 0) || !(tauxVente > 0)) {
      setFormErr('Renseignez des taux valides (> 0).');
      return;
    }
    setSaving('1');
    try {
      const vendeurNom = vendeur.trim() || null;
      if (editing) {
        await api.patch(`/admin/offres/${editing.id}`, { tauxAchat, tauxVente, vendeurNom });
        setMsg(`Taux ${LABELS[editing.devise]} mis à jour.`);
      } else {
        await api.post('/admin/offres', {
          devise: newDevise,
          tauxAchat,
          tauxVente,
          vendeurNom: vendeurNom ?? undefined,
        });
        setMsg(`Devise ${LABELS[newDevise]} publiée.`);
      }
      close();
      await load();
    } catch {
      setFormErr("Échec de l'enregistrement. Réessayez.");
    } finally {
      setSaving('');
    }
  };

  const toggle = async (o: Offre) => {
    await api.patch(`/admin/offres/${o.id}`, { statut: o.statut === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' });
    await load();
  };

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, margin: '0 0 4px' }}>Offres &amp; taux</h1>
          <p style={{ color: 'var(--text-soft)', margin: '0 0 24px' }}>
            Modifiez les taux par devise à tout moment. Chaque changement est historisé.
          </p>
        </div>
        {manquantes.length > 0 && (
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={18} /> Publier une devise
          </button>
        )}
      </div>

      {msg && (
        <div
          className="badge"
          style={{ color: colors.success, borderColor: colors.success + '55', background: colors.success + '14', marginBottom: 16, padding: '8px 14px' }}
        >
          {msg}
        </div>
      )}

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Devise</th>
              <th>Achat (GNF)</th>
              <th>Vente (GNF)</th>
              <th>Vendeur</th>
              <th>Statut</th>
              <th>Mise à jour</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {offres.map((o) => (
              <tr key={o.id} style={{ cursor: 'default' }}>
                <td style={{ fontWeight: 600 }}>
                  {LABELS[o.devise]} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>· GNF / {o.devise}</span>
                </td>
                <td style={{ color: colors.success, fontWeight: 600 }}>{Number(o.tauxAchat).toLocaleString('fr-FR')}</td>
                <td style={{ color: colors.brand, fontWeight: 600 }}>{Number(o.tauxVente).toLocaleString('fr-FR')}</td>
                <td style={{ color: 'var(--text-soft)' }}>{o.vendeurNom || '—'}</td>
                <td>
                  <span
                    className="badge"
                    style={{
                      color: o.statut === 'ACTIVE' ? colors.success : colors.textMuted,
                      borderColor: o.statut === 'ACTIVE' ? colors.success + '55' : colors.border,
                      background: o.statut === 'ACTIVE' ? colors.success + '14' : 'transparent',
                    }}
                  >
                    {o.statut === 'ACTIVE' ? 'Active' : o.statut === 'INACTIVE' ? 'Inactive' : 'Brouillon'}
                  </span>
                </td>
                <td style={{ color: 'var(--text-soft)', fontSize: 13 }}>{new Date(o.majAt).toLocaleString('fr-FR')}</td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button className="btn btn-primary" style={{ height: 34 }} onClick={() => openEdit(o)}>
                    <Pencil size={16} /> Modifier
                  </button>
                  <button className="btn btn-ghost" style={{ height: 34, marginLeft: 8 }} onClick={() => toggle(o)} title={o.statut === 'ACTIVE' ? 'Désactiver' : 'Activer'}>
                    {o.statut === 'ACTIVE' ? <ToggleRight size={18} color={colors.success} /> : <ToggleLeft size={18} />}
                  </button>
                </td>
              </tr>
            ))}
            {offres.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
                  Aucune devise publiée. Cliquez « Publier une devise ».
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pop-up modification / publication */}
      {(editing || createOpen) && (
        <div
          onClick={close}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(14,23,38,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card"
            style={{ width: '100%', maxWidth: 440, padding: 28 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <h2 style={{ fontSize: 20, margin: 0 }}>
                {editing ? `Modifier — ${LABELS[editing.devise]}` : 'Publier une devise'}
              </h2>
              <button className="btn btn-ghost" style={{ height: 34, padding: '0 8px' }} onClick={close}>
                <X size={18} />
              </button>
            </div>
            <p style={{ color: 'var(--text-soft)', fontSize: 13, margin: '0 0 20px' }}>
              Taux exprimés en GNF pour 1 unité de devise.
            </p>

            {!editing && (
              <div className="field">
                <label>Devise</label>
                <select className="input" value={newDevise} onChange={(e) => setNewDevise(e.target.value as (typeof DEVISES)[number])}>
                  {manquantes.map((dv) => (
                    <option key={dv} value={dv}>
                      {LABELS[dv]} · GNF / {dv}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ display: 'flex', gap: 16 }}>
              <div className="field" style={{ flex: 1, minWidth: 0 }}>
                <label>Taux d'achat (GNF)</label>
                <input className="input" style={{ width: '100%', boxSizing: 'border-box' }} inputMode="decimal" value={achat} onChange={(e) => setAchat(e.target.value)} placeholder="8600" autoFocus />
              </div>
              <div className="field" style={{ flex: 1, minWidth: 0 }}>
                <label>Taux de vente (GNF)</label>
                <input className="input" style={{ width: '100%', boxSizing: 'border-box' }} inputMode="decimal" value={vente} onChange={(e) => setVente(e.target.value)} placeholder="8750" />
              </div>
            </div>
            <div className="field">
              <label>Vendeur (interne — non visible côté client)</label>
              <input className="input" style={{ width: '100%', boxSizing: 'border-box' }} value={vendeur} onChange={(e) => setVendeur(e.target.value)} placeholder="—" />
            </div>

            {formErr && <p style={{ color: colors.danger, fontSize: 13, margin: '4px 0 0' }}>{formErr}</p>}

            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={close} disabled={!!saving}>
                Annuler
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={save} disabled={!!saving}>
                <Save size={18} /> {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
