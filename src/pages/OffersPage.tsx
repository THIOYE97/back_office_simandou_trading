import { useEffect, useState } from 'react';
import { Save, ToggleLeft, ToggleRight } from 'lucide-react';
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

export function OffersPage() {
  const [offres, setOffres] = useState<Offre[]>([]);
  const [devise, setDevise] = useState<(typeof DEVISES)[number]>('USD');
  const [achat, setAchat] = useState('');
  const [vente, setVente] = useState('');
  const [vendeur, setVendeur] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = () => api.get<Offre[]>('/admin/offres').then((r) => setOffres(r.data));
  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const tauxAchat = Number(achat);
    const tauxVente = Number(vente);
    if (!(tauxAchat > 0) || !(tauxVente > 0)) {
      setMsg('Taux invalides.');
      return;
    }
    setBusy(true);
    try {
      const vendeurNom = vendeur.trim() || undefined;
      const existing = offres.find((o) => o.devise === devise);
      if (existing) {
        await api.patch(`/admin/offres/${existing.id}`, { tauxAchat, tauxVente, vendeurNom });
      } else {
        await api.post('/admin/offres', { devise, tauxAchat, tauxVente, vendeurNom });
      }
      setAchat('');
      setVente('');
      setVendeur('');
      setMsg('Taux enregistrés.');
      await load();
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (o: Offre) => {
    await api.patch(`/admin/offres/${o.id}`, {
      statut: o.statut === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
    });
    await load();
  };

  return (
    <div style={{ maxWidth: 820 }}>
      <h1 style={{ fontSize: 26, margin: '0 0 4px' }}>Offres &amp; taux</h1>
      <p style={{ color: 'var(--text-soft)', margin: '0 0 24px' }}>
        Publiez les taux d'achat et de vente par devise (contre GNF).
      </p>

      <form onSubmit={submit} className="card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="field" style={{ margin: 0 }}>
            <label>Devise</label>
            <select
              className="input"
              value={devise}
              onChange={(e) => setDevise(e.target.value as (typeof DEVISES)[number])}
            >
              {DEVISES.map((d) => (
                <option key={d} value={d}>
                  GNF / {d}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Taux d'achat (GNF)</label>
            <input className="input" inputMode="decimal" value={achat} onChange={(e) => setAchat(e.target.value)} placeholder="8600" />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Taux de vente (GNF)</label>
            <input className="input" inputMode="decimal" value={vente} onChange={(e) => setVente(e.target.value)} placeholder="8750" />
          </div>
          <div className="field" style={{ margin: 0, minWidth: 200 }}>
            <label>Vendeur (nom / entité)</label>
            <input className="input" value={vendeur} onChange={(e) => setVendeur(e.target.value)} placeholder="Interne — non visible côté client" />
          </div>
          <button className="btn btn-primary" disabled={busy}>
            <Save size={18} /> Enregistrer
          </button>
        </div>
        {msg && <p style={{ marginTop: 12, color: 'var(--text-soft)', fontSize: 13 }}>{msg}</p>}
      </form>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Paire</th>
              <th>Vendeur</th>
              <th>Achat</th>
              <th>Vente</th>
              <th>Statut</th>
              <th>Mise à jour</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {offres.map((o) => (
              <tr key={o.id} style={{ cursor: 'default' }}>
                <td style={{ fontWeight: 600 }}>GNF / {o.devise}</td>
                <td style={{ color: 'var(--text-soft)' }}>{o.vendeurNom || '—'}</td>
                <td>{Number(o.tauxAchat).toLocaleString('fr-FR')}</td>
                <td>{Number(o.tauxVente).toLocaleString('fr-FR')}</td>
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
                <td>{new Date(o.majAt).toLocaleString('fr-FR')}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-ghost" style={{ height: 34 }} onClick={() => toggle(o)}>
                    {o.statut === 'ACTIVE' ? <ToggleRight size={18} color={colors.success} /> : <ToggleLeft size={18} />}
                    {o.statut === 'ACTIVE' ? 'Désactiver' : 'Activer'}
                  </button>
                </td>
              </tr>
            ))}
            {offres.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
                  Aucune offre. Créez vos premiers taux ci-dessus.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
