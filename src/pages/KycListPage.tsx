import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Inbox, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';

interface Row {
  clientId: string;
  telephone: string;
  type: 'PARTICULIER' | 'BUSINESS';
  infos: Record<string, string>;
  soumisAt: string;
}

const nameOf = (r: Row) =>
  r.type === 'BUSINESS' ? r.infos?.raisonSociale : `${r.infos?.nom ?? ''} ${r.infos?.prenom ?? ''}`.trim();

export function KycListPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get<Row[]>('/admin/kyc/dossiers')
      .then((r) => setRows(r.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: 26, margin: '0 0 4px' }}>Dossiers KYC</h1>
      <p style={{ color: 'var(--text-soft)', margin: '0 0 24px' }}>
        Dossiers en attente de vérification ({rows.length})
      </p>

      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Chargement…</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 56, textAlign: 'center', color: 'var(--text-muted)' }}>
            <Inbox size={40} style={{ opacity: 0.5 }} />
            <p style={{ marginTop: 12 }}>Aucun dossier en attente.</p>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Client</th>
                <th>Téléphone</th>
                <th>Type</th>
                <th>Soumis le</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.clientId} onClick={() => navigate(`/kyc/${r.clientId}`)}>
                  <td style={{ fontWeight: 600 }}>{nameOf(r) || '—'}</td>
                  <td>{r.telephone}</td>
                  <td>{r.type === 'BUSINESS' ? 'Entreprise' : 'Particulier'}</td>
                  <td>{new Date(r.soumisAt).toLocaleString('fr-FR')}</td>
                  <td style={{ textAlign: 'right', color: 'var(--brand)' }}>
                    <ChevronRight size={18} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
