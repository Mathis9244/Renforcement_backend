import { useMemo, useState } from 'react';
import './App.css';
import { api, ApiError, getToken, setToken, type AuditLog, type CaseFile, type Claim } from './lib/api';
import { Button, Card, CodeBox, Field, SelectField } from './components/ui';

function App() {
  const [token, setTokenState] = useState(() => getToken());
  const [active, setActive] = useState<'claims' | 'caseFiles' | 'approvals' | 'audit'>('claims');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [last, setLast] = useState<any>(null);

  const isAuthed = Boolean(token);

  async function run<T>(fn: () => Promise<T>) {
    setBusy(true);
    setError(null);
    try {
      const out = await fn();
      setLast(out);
      return out;
    } catch (e: any) {
      const msg = e instanceof ApiError ? `${e.status} — ${e.message}` : e?.message || String(e);
      setError(msg);
      setLast(e instanceof ApiError ? e.payload : null);
      throw e;
    } finally {
      setBusy(false);
    }
  }

  const header = useMemo(() => {
    const tabs: Array<{ key: typeof active; label: string }> = [
      { key: 'claims', label: 'Sinistres' },
      { key: 'caseFiles', label: 'Dossiers' },
      { key: 'approvals', label: 'Approvals' },
      { key: 'audit', label: 'Audit' },
    ];
    return (
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {tabs.map((t) => (
          <Button
            key={t.key}
            variant={active === t.key ? 'primary' : 'ghost'}
            onClick={() => setActive(t.key)}
            disabled={!isAuthed}
          >
            {t.label}
          </Button>
        ))}
      </div>
    );
  }, [active, isAuthed]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(1200px 700px at 15% 10%, rgba(79,70,229,0.25), transparent), #0b1020',
        color: 'white',
      }}
    >
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: 18, display: 'grid', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>AssurMoi — Front de test</div>
            <div style={{ opacity: 0.8, fontSize: 12 }}>API: `http://localhost:3000` (via proxy Vite)</div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {isAuthed ? (
              <Button
                variant="ghost"
                onClick={() => {
                  setToken(null);
                  setTokenState(null);
                  setLast(null);
                }}
              >
                Se déconnecter
              </Button>
            ) : null}
            <div style={{ fontSize: 12, opacity: 0.8 }}>{busy ? 'Requête en cours…' : null}</div>
          </div>
        </div>

        <Card title="Authentification">
          <LoginPanel
            onLoggedIn={(t) => {
              setToken(t);
              setTokenState(t);
            }}
            onError={(m) => setError(m)}
            disabled={busy}
          />
        </Card>

        <Card title="Navigation" right={header}>
          <div style={{ display: 'grid', gap: 12 }}>
            {error ? (
              <div
                style={{
                  border: '1px solid rgba(239,68,68,0.4)',
                  background: 'rgba(239,68,68,0.12)',
                  padding: 10,
                  borderRadius: 12,
                }}
              >
                <b>Erreur</b> — {error}
              </div>
            ) : null}

            {isAuthed ? (
              <>
                {active === 'claims' ? <ClaimsPanel run={run} busy={busy} /> : null}
                {active === 'caseFiles' ? <CaseFilesPanel run={run} busy={busy} /> : null}
                {active === 'approvals' ? <ApprovalsPanel run={run} busy={busy} /> : null}
                {active === 'audit' ? <AuditPanel run={run} busy={busy} /> : null}
              </>
            ) : (
              <div style={{ opacity: 0.8 }}>Connecte-toi pour accéder aux tests.</div>
            )}
          </div>
        </Card>

        <Card title="Dernière réponse API">
          <CodeBox value={last} />
        </Card>
      </div>
    </div>
  );
}

function LoginPanel(props: {
  onLoggedIn: (token: string) => void;
  onError: (m: string) => void;
  disabled: boolean;
}) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin123!');
  const [localBusy, setLocalBusy] = useState(false);

  const busy = props.disabled || localBusy;

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, alignItems: 'end' }}>
        <Field label="Username" value={username} onChange={setUsername} placeholder="admin" />
        <Field label="Password" value={password} onChange={setPassword} type="password" placeholder="Admin123!" />
        <Button
          onClick={async () => {
            setLocalBusy(true);
            props.onError('');
            try {
              const res = await api.login(username, password);
              if (!res.token) {
                props.onError(res.message || 'Login OK mais token manquant');
                return;
              }
              props.onLoggedIn(res.token);
            } catch (e: any) {
              props.onError(e?.message || 'Login error');
            } finally {
              setLocalBusy(false);
            }
          }}
          disabled={busy}
        >
          Se connecter
        </Button>
      </div>
      <div style={{ fontSize: 12, opacity: 0.8 }}>
        Astuce: si le backend tourne dans Docker, garde `http://localhost:3000`.
      </div>
    </div>
  );
}

function ClaimsPanel(props: { run: <T>(fn: () => Promise<T>) => Promise<T>; busy: boolean }) {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [vehicleRegistration, setVehicleRegistration] = useState('AA-123-AA');
  const [driverFirstName, setDriverFirstName] = useState('Jean');
  const [driverLastName, setDriverLastName] = useState('Dupont');
  const [callAt, setCallAt] = useState(new Date().toISOString());
  const [accidentAt, setAccidentAt] = useState(new Date(Date.now() - 30 * 60 * 1000).toISOString());
  const [contextText, setContextText] = useState('Test via front');
  const [liabilityAccepted, setLiabilityAccepted] = useState('false');
  const [liabilityPercent, setLiabilityPercent] = useState('0');
  const [scenario, setScenario] = useState<'reparable' | 'total_loss'>('reparable');
  const [activeClaimId, setActiveClaimId] = useState<string>('1');

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Card
        title="Lister les sinistres"
        right={
          <Button
            onClick={async () => {
              const res = await props.run(() => api.listClaims());
              setClaims(res.claims);
            }}
            disabled={props.busy}
          >
            Rafraîchir
          </Button>
        }
      >
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Résultat ({claims.length})</div>
          <CodeBox value={claims} />
        </div>
      </Card>

      <Card title="Créer un sinistre (draft)">
        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <Field label="Immatriculation" value={vehicleRegistration} onChange={setVehicleRegistration} />
            <Field label="Prénom conducteur" value={driverFirstName} onChange={setDriverFirstName} />
            <Field label="Nom conducteur" value={driverLastName} onChange={setDriverLastName} />
            <Field label="callAt (ISO)" value={callAt} onChange={setCallAt} />
            <Field label="accidentAt (ISO)" value={accidentAt} onChange={setAccidentAt} />
            <Field label="Contexte" value={contextText} onChange={setContextText} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <SelectField
              label="Responsabilité engagée ?"
              value={liabilityAccepted}
              onChange={setLiabilityAccepted}
              options={[
                { value: 'false', label: 'Non' },
                { value: 'true', label: 'Oui' },
              ]}
            />
            <SelectField
              label="% responsabilité"
              value={liabilityPercent}
              onChange={setLiabilityPercent}
              options={[
                { value: '0', label: '0' },
                { value: '50', label: '50' },
                { value: '100', label: '100' },
              ]}
            />
            <Button
              onClick={async () => {
                const res = await props.run(() =>
                  api.createClaim({
                    vehicleRegistration,
                    driverFirstName,
                    driverLastName,
                    driverIsInsured: true,
                    callAt,
                    accidentAt,
                    contextText,
                    liabilityAccepted: liabilityAccepted === 'true',
                    liabilityPercent: Number(liabilityAccepted === 'true' ? liabilityPercent : '0'),
                  } as any)
                );
                setActiveClaimId(String(res.claim.id));
              }}
              disabled={props.busy}
            >
              Créer
            </Button>
          </div>
        </div>
      </Card>

      <Card title="Documents + complétion (création dossier)">
        <div style={{ display: 'grid', gap: 10 }}>
          <Field label="Claim ID" value={activeClaimId} onChange={setActiveClaimId} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <Button
              disabled={props.busy}
              onClick={() =>
                props.run(() => api.addDocument(Number(activeClaimId), { docType: 'attestation_assurance', fileUrl: 'https://example.com/a.pdf' }))
              }
            >
              + Attestation
            </Button>
            <Button
              disabled={props.busy}
              onClick={() =>
                props.run(() => api.addDocument(Number(activeClaimId), { docType: 'carte_grise', fileUrl: 'https://example.com/cg.pdf' }))
              }
            >
              + Carte grise
            </Button>
            <Button
              disabled={props.busy}
              onClick={() =>
                props.run(() => api.addDocument(Number(activeClaimId), { docType: 'piece_identite_conducteur', fileUrl: 'https://example.com/id.pdf' }))
              }
            >
              + Pièce identité
            </Button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'end' }}>
            <SelectField
              label="Scenario"
              value={scenario}
              onChange={(v) => setScenario(v as any)}
              options={[
                { value: 'reparable', label: 'Réparable' },
                { value: 'total_loss', label: 'VE (total_loss)' },
              ]}
            />
            <Button
              disabled={props.busy}
              onClick={() => props.run(() => api.completeClaim(Number(activeClaimId), { scenario }))}
            >
              Compléter (créer dossier)
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function CaseFilesPanel(props: { run: <T>(fn: () => Promise<T>) => Promise<T>; busy: boolean }) {
  const [caseFiles, setCaseFiles] = useState<CaseFile[]>([]);
  const [caseId, setCaseId] = useState('1');
  const [toState, setToState] = useState('EXPERTISE_EN_ATTENTE');
  const [comment, setComment] = useState('test');

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Card
        title="Lister les dossiers"
        right={
          <Button
            disabled={props.busy}
            onClick={async () => {
              const res = await props.run(() => api.listCaseFiles());
              setCaseFiles(res.caseFiles);
            }}
          >
            Rafraîchir
          </Button>
        }
      >
        <CodeBox value={caseFiles} />
      </Card>

      <Card title="Transition dossier">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 10, alignItems: 'end' }}>
          <Field label="Case ID" value={caseId} onChange={setCaseId} />
          <Field label="toState" value={toState} onChange={setToState} />
          <Field label="comment" value={comment} onChange={setComment} />
          <Button
            disabled={props.busy}
            onClick={() => props.run(() => api.transitionCaseFile(Number(caseId), { toState, comment }))}
          >
            Transition
          </Button>
        </div>
        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
          Exemples: `EXPERTISE_PLANIFIEE`, `EXPERTISE_REALISEE`, `FACTURE_RECUE`, `REGLEMENT_REALISE`, `DOSSIER_CLOS`…
        </div>
      </Card>
    </div>
  );
}

function ApprovalsPanel(props: { run: <T>(fn: () => Promise<T>) => Promise<T>; busy: boolean }) {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [approvalId, setApprovalId] = useState('1');
  const [decision, setDecision] = useState<'approved' | 'rejected'>('approved');

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Card
        title="Approvals en attente"
        right={
          <Button
            disabled={props.busy}
            onClick={async () => {
              const res = await props.run(() => api.listPendingApprovals());
              setApprovals(res.approvals as any);
            }}
          >
            Rafraîchir
          </Button>
        }
      >
        <CodeBox value={approvals} />
      </Card>
      <Card title="Décider une approval">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, alignItems: 'end' }}>
          <Field label="Approval ID" value={approvalId} onChange={setApprovalId} />
          <SelectField
            label="Decision"
            value={decision}
            onChange={(v) => setDecision(v as any)}
            options={[
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
            ]}
          />
          <Button disabled={props.busy} onClick={() => props.run(() => api.decideApproval(Number(approvalId), decision))}>
            Envoyer
          </Button>
        </div>
      </Card>
    </div>
  );
}

function AuditPanel(props: { run: <T>(fn: () => Promise<T>) => Promise<T>; busy: boolean }) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [limit, setLimit] = useState('50');

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Card
        title="Audit logs"
        right={
          <div style={{ display: 'flex', gap: 10, alignItems: 'end' }}>
            <Field label="limit" value={limit} onChange={setLimit} />
            <Button
              disabled={props.busy}
              onClick={async () => {
                const res = await props.run(() => api.listAuditLogs(Number(limit) || 50));
                setLogs(res.logs);
              }}
            >
              Charger
            </Button>
          </div>
        }
      >
        <CodeBox value={logs} />
      </Card>
    </div>
  );
}

export default App;
