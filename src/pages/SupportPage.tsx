import { useCallback, useEffect, useRef, useState } from 'react';
import { Paperclip, Send, FileText, MessagesSquare, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { api } from '../lib/api';
import { createSocket } from '../lib/socket';
import { colors } from '../theme';

type Statut = 'OUVERT' | 'RESOLU' | 'FERME';
interface Message {
  id: string;
  ticketId: string;
  expediteur: 'CLIENT' | 'SUPPORT';
  texte: string | null;
  fichierType: 'image' | 'pdf' | null;
  fichierNom: string | null;
  hasFichier: boolean;
  createdAt: string;
}
interface Ticket {
  id: string;
  sujet: string;
  statut: Statut;
  clientId: string;
  nom: string | null;
  telephone: string;
  dernierMessageAt: string;
  apercu: string | null;
  nonLus: number;
}

const STATUT: Record<Statut, { label: string; color: string }> = {
  OUVERT: { label: 'Ouvert', color: colors.brand },
  RESOLU: { label: 'Résolu', color: colors.success },
  FERME: { label: 'Fermé', color: colors.textMuted },
};
const TABS: { key: string; label: string }[] = [
  { key: '', label: 'Tous' },
  { key: 'OUVERT', label: 'Ouverts' },
  { key: 'RESOLU', label: 'Résolus' },
  { key: 'FERME', label: 'Fermés' },
];

function Attachment({ msg }: { msg: Message }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let objectUrl: string | null = null;
    api
      .get(`/admin/support/files/${msg.id}`, { responseType: 'blob' })
      .then((r) => {
        objectUrl = URL.createObjectURL(r.data);
        setUrl(objectUrl);
      })
      .catch(() => setUrl(null));
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [msg.id]);

  if (msg.fichierType === 'image') {
    return url ? (
      <a href={url} target="_blank" rel="noreferrer">
        <img src={url} alt={msg.fichierNom ?? ''} style={{ maxWidth: 220, borderRadius: 10, display: 'block' }} />
      </a>
    ) : (
      <div style={{ width: 180, height: 120, background: 'rgba(0,0,0,0.06)', borderRadius: 10 }} />
    );
  }
  return (
    <a href={url ?? '#'} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'inherit', textDecoration: 'none' }}>
      <FileText size={18} />
      <span style={{ fontWeight: 600, fontSize: 14 }}>{msg.fichierNom ?? 'Document.pdf'}</span>
    </a>
  );
}

const nomAffiche = (t: Ticket) => t.nom || t.telephone;

export function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [tab, setTab] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ sujet: string; statut: Statut; telephone: string } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const selectedRef = useRef<string | null>(null);
  const tabRef = useRef('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const loadTickets = useCallback(() => {
    api
      .get<Ticket[]>('/admin/support/tickets', { params: tabRef.current ? { statut: tabRef.current } : {} })
      .then((r) => setTickets(r.data));
  }, []);

  const loadMessages = useCallback((id: string) => {
    api.get<{ sujet: string; statut: Statut; telephone: string; messages: Message[] }>(`/admin/support/tickets/${id}/messages`).then((r) => {
      setMessages(r.data.messages);
      setDetail({ sujet: r.data.sujet, statut: r.data.statut, telephone: r.data.telephone });
      setTickets((list) => list.map((t) => (t.id === id ? { ...t, nonLus: 0 } : t)));
    });
  }, []);

  useEffect(() => {
    tabRef.current = tab;
    loadTickets();
  }, [tab, loadTickets]);

  useEffect(() => {
    const socket = createSocket();
    socket.on('support:message', (m: Message) => {
      loadTickets();
      if (m.ticketId === selectedRef.current) {
        setMessages((list) => (list.some((x) => x.id === m.id) ? list : [...list, m]));
      }
    });
    return () => {
      socket.disconnect();
    };
  }, [loadTickets]);

  useEffect(() => {
    selectedRef.current = selected;
    if (selected) loadMessages(selected);
  }, [selected, loadMessages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const send = async () => {
    if ((!text.trim() && !file) || !selected || sending) return;
    setSending(true);
    try {
      const form = new FormData();
      if (text.trim()) form.append('texte', text.trim());
      if (file) form.append('fichier', file);
      const { data } = await api.post<Message>(`/admin/support/tickets/${selected}/messages`, form);
      setMessages((list) => (list.some((x) => x.id === data.id) ? list : [...list, data]));
      setText('');
      setFile(null);
      if (fileInput.current) fileInput.current.value = '';
      loadTickets();
    } finally {
      setSending(false);
    }
  };

  const setStatut = async (statut: Statut) => {
    if (!selected) return;
    await api.patch(`/admin/support/tickets/${selected}`, { statut });
    setDetail((d) => (d ? { ...d, statut } : d));
    loadTickets();
  };

  return (
    <div>
      <h1 style={{ fontSize: 26, margin: '0 0 4px' }}>Support</h1>
      <p style={{ color: 'var(--text-soft)', margin: '0 0 16px' }}>Tickets d'assistance — un client peut ouvrir plusieurs demandes.</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="btn"
              style={{ height: 34, padding: '0 14px', fontSize: 13, background: active ? colors.brand : '#fff', color: active ? '#fff' : 'var(--text-soft)', border: `1px solid ${active ? colors.brand : 'var(--border)'}` }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="card" style={{ display: 'flex', height: 'calc(100vh - 240px)', overflow: 'hidden', padding: 0 }}>
        {/* Liste des tickets */}
        <div style={{ width: 330, borderRight: `1px solid ${colors.border}`, overflowY: 'auto' }}>
          {tickets.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Aucun ticket.</div>}
          {tickets.map((t) => {
            const active = t.id === selected;
            const s = STATUT[t.statut];
            return (
              <div
                key={t.id}
                onClick={() => setSelected(t.id)}
                style={{ padding: '14px 16px', borderBottom: `1px solid ${colors.border}`, cursor: 'pointer', background: active ? colors.brand + '10' : 'transparent' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.sujet}</span>
                  {t.nonLus > 0 && (
                    <span style={{ background: colors.accent, color: '#fff', borderRadius: 999, fontSize: 11, fontWeight: 700, minWidth: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
                      {t.nonLus}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span className="badge" style={{ color: s.color, borderColor: s.color + '55', background: s.color + '14', fontSize: 11 }}>{s.label}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nomAffiche(t)}</span>
                </div>
                {t.apercu && <div style={{ color: 'var(--text-soft)', fontSize: 12.5, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.apercu}</div>}
              </div>
            );
          })}
        </div>

        {/* Panneau de discussion */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {!detail ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: 10 }}>
              <MessagesSquare size={40} style={{ opacity: 0.5 }} />
              <span>Sélectionnez un ticket.</span>
            </div>
          ) : (
            <>
              <div style={{ padding: '12px 20px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{detail.sujet}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>{detail.telephone}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {detail.statut !== 'RESOLU' && detail.statut !== 'FERME' && (
                    <button className="btn btn-ghost" style={{ height: 32, padding: '0 10px', fontSize: 13 }} onClick={() => setStatut('RESOLU')}>
                      <CheckCircle size={16} color={colors.success} /> Résolu
                    </button>
                  )}
                  {detail.statut !== 'OUVERT' && (
                    <button className="btn btn-ghost" style={{ height: 32, padding: '0 10px', fontSize: 13 }} onClick={() => setStatut('OUVERT')}>
                      <RotateCcw size={16} /> Rouvrir
                    </button>
                  )}
                  {detail.statut !== 'FERME' && (
                    <button className="btn btn-ghost" style={{ height: 32, padding: '0 10px', fontSize: 13 }} onClick={() => setStatut('FERME')}>
                      <XCircle size={16} color={colors.danger} /> Fermer
                    </button>
                  )}
                </div>
              </div>

              <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 10, background: colors.bg }}>
                {messages.map((m) => {
                  const mine = m.expediteur === 'SUPPORT';
                  return (
                    <div key={m.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                      <div style={{ maxWidth: '72%', background: mine ? colors.brand : '#fff', color: mine ? '#fff' : colors.text, border: mine ? 'none' : `1px solid ${colors.border}`, borderRadius: 14, borderBottomRightRadius: mine ? 4 : 14, borderBottomLeftRadius: mine ? 14 : 4, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {m.hasFichier && <Attachment msg={m} />}
                        {m.texte && <span style={{ fontSize: 14.5, lineHeight: 1.4 }}>{m.texte}</span>}
                        <span style={{ fontSize: 10.5, opacity: 0.7, alignSelf: 'flex-end' }}>
                          {new Date(m.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ borderTop: `1px solid ${colors.border}`, padding: 12, display: 'flex', alignItems: 'flex-end', gap: 10 }}>
                <input ref={fileInput} type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                <button className="btn btn-ghost" style={{ height: 40, padding: '0 10px' }} onClick={() => fileInput.current?.click()} title="Joindre un fichier">
                  <Paperclip size={18} />
                </button>
                <div style={{ flex: 1 }}>
                  {file && (
                    <div style={{ fontSize: 12, color: 'var(--text-soft)', marginBottom: 4 }}>
                      Pièce jointe : {file.name}{' '}
                      <span style={{ color: colors.danger, cursor: 'pointer' }} onClick={() => { setFile(null); if (fileInput.current) fileInput.current.value = ''; }}>(retirer)</span>
                    </div>
                  )}
                  <textarea
                    className="input"
                    style={{ width: '100%', boxSizing: 'border-box', resize: 'none', height: 40, paddingTop: 9 }}
                    placeholder="Votre réponse…"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                  />
                </div>
                <button className="btn btn-primary" style={{ height: 40 }} onClick={send} disabled={sending || (!text.trim() && !file)}>
                  <Send size={18} /> Envoyer
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
