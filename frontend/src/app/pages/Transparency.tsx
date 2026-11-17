import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { AnimatedNumber, useAppReveal } from '../../features/motion/primitives';
import { animalLabel, dateText, inr, splitName, type AnimalType } from '../lib/programs';
import { IconChart, IconCut, IconHand, IconKnife, IconPackage, IconRefresh, IconShield } from '../ui/Icons';
import { IconReceipt, IconTruck, IconWallet } from '../ui/more-icons';
import { ErrorNote, Loading, PageHead } from '../ui/kit';
import { categoryLabel } from './ManageLedger';

type IndexItem = {
  id: string;
  name: string;
  status: string;
  targetDate: string;
  mahalluName: string;
  district: string;
};

type PublicStage = 'OPEN' | 'SCHEDULED' | 'SLAUGHTERING' | 'PROCESSING' | 'COMPLETED' | 'DISTRIBUTING' | 'ENDED';

type PublicUpdate = {
  id: string;
  stage: 'program' | 'slaughter' | 'processing' | 'completed' | 'distribution';
  title: string;
  detail: string;
  at: string | null;
  state: 'done' | 'live';
};

type Ledger = {
  program: { id: string; name: string; status: string; targetDate: string; mahalluName: string; district: string };
  collected: number;
  payments: number;
  spent: number;
  balance: number;
  byCategory: { category: string; amount: number }[];
  liveStage?: PublicStage;
  overallPercent?: number;
  animals: {
    total: number;
    pending?: number;
    slaughtered: number;
    processing: number;
    packed: number;
    cumulative?: { slaughtered: number; processing: number; completed: number };
    milestones?: {
      slaughterStartedAt: string | null;
      slaughterCompletedAt: string | null;
      processingStartedAt: string | null;
      processingCompletedAt: string | null;
      packingStartedAt: string | null;
      packingCompletedAt: string | null;
    };
    byType?: { animalType: string; total: number; pending: number; slaughtered: number; processing: number; packed: number }[];
  };
  distribution?: {
    started: boolean;
    startedAt: string | null;
    packetsIssued: number;
    packetsHandedOut: number;
    householdsServed: number;
  };
  meat: { packetsHandedOut: number; householdsServed: number };
  updates?: PublicUpdate[];
  expenses: {
    id: string;
    title: string;
    category: string;
    amount: number;
    spentOn: string;
    note: string | null;
    voidedAt: string | null;
    voidReason: string | null;
  }[];
  generatedAt: string;
};

const STAGE_LABELS: Record<PublicStage, string> = {
  OPEN: 'Programme Open',
  SCHEDULED: 'Animals Scheduled',
  SLAUGHTERING: 'Slaughter Underway',
  PROCESSING: 'Processing Underway',
  COMPLETED: 'Animals Completed',
  DISTRIBUTING: 'Distribution Started',
  ENDED: 'Programme Completed',
};

const CATEGORY_COLORS: Record<string, string> = {
  ANIMALS: '#085038',
  TRANSPORT: '#2a8f72',
  LABOUR: '#52aa8e',
  PACKING: '#86c6b0',
  FOOD: '#e59a47',
  OTHER: '#9aaea6',
};

function signedInr(amount: number) {
  const abs = Math.abs(amount);
  return amount < 0 ? `−₹${abs.toLocaleString('en-IN')}` : inr(abs);
}

function shortTime(value: string | null | undefined) {
  if (!value) return '';
  return new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

function stageHeadline(ledger: Ledger, stage: PublicStage) {
  const total = ledger.animals.total;
  const cumSlaughtered = ledger.animals.cumulative?.slaughtered ?? (ledger.animals.slaughtered + ledger.animals.processing + ledger.animals.packed);
  const cumCompleted = ledger.animals.cumulative?.completed ?? ledger.animals.packed;
  const packets = ledger.distribution?.packetsHandedOut ?? ledger.meat.packetsHandedOut;
  const households = ledger.distribution?.householdsServed ?? ledger.meat.householdsServed;

  switch (stage) {
    case 'DISTRIBUTING':
      return packets > 0
        ? `Meat distribution has started — ${packets} ${packets === 1 ? 'packet' : 'packets'} handed out to ${households} ${households === 1 ? 'household' : 'households'} so far.`
        : 'Meat distribution has started — packets are with field volunteers for handover.';
    case 'COMPLETED':
      return `All ${total} animals are completed and packed. Meat distribution is preparing to begin.`;
    case 'PROCESSING':
      return `Overall slaughter & processing underway — ${cumCompleted} of ${total} animals completed and packed.`;
    case 'SLAUGHTERING':
      return `Slaughter has started — ${cumSlaughtered} of ${total} scheduled animals slaughtered so far.`;
    case 'SCHEDULED':
      return `${total} ${total === 1 ? 'animal is' : 'animals are'} scheduled for Udhiyya on ${dateText(ledger.program.targetDate)}. Live progress appears here automatically.`;
    case 'ENDED':
      return `This Udhiyya cycle has concluded. All aggregate records and expenses remain permanently open for review.`;
    default:
      return `Udhiyya scheduled for ${dateText(ledger.program.targetDate)}. Financial records and overall operational milestones are updated here in real time.`;
  }
}

/** Public unauthenticated fetcher with silent background refresh support. */
function usePublicFetch<T>(path: string | null) {
  const [state, setState] = useState<{ data: T | null; error: string; loading: boolean; refreshing: boolean }>({
    data: null, error: '', loading: Boolean(path), refreshing: false,
  });
  const [tick, setTick] = useState(0);
  const hasData = useRef(false);

  useEffect(() => {
    hasData.current = false;
  }, [path]);

  useEffect(() => {
    if (!path) return;
    let active = true;
    setState(prev => ({ ...prev, loading: !hasData.current, refreshing: hasData.current }));
    api<T>(path, 'GET', undefined, false).then(
      data => {
        if (!active) return;
        hasData.current = true;
        setState({ data, error: '', loading: false, refreshing: false });
      },
      err => {
        if (!active) return;
        setState(prev => ({
          data: prev.data,
          loading: false,
          refreshing: false,
          error: err instanceof Error ? err.message : 'Could not load public ledger.',
        }));
      },
    );
    return () => { active = false; };
  }, [path, tick]);

  const reload = useCallback(() => setTick(v => v + 1), []);
  return { ...state, reload };
}

export function TransparencyIndex({ showList = false }: { showList?: boolean }) {
  const { data, error, loading } = usePublicFetch<IndexItem[]>('/public/ledgers');

  // Automatically open the currently active (OPEN) programme's ledger when clicking "Public ledger"
  if (!showList && data && data.length > 0) {
    const active = data.find(item => item.status === 'OPEN') ?? data[0];
    return <Navigate to={`/transparency/${active.id}`} replace />;
  }

  const running = (data ?? []).filter(item => item.status === 'OPEN');
  const ended = (data ?? []).filter(item => item.status !== 'OPEN');

  return <>
    <PageHead
      eyebrow="Open books · Public directory"
      title={<>Every rupee &amp; milestone, <span className="serif">in the open.</span></>}
      sub="Select any mahallu programme to view live overall animal progress, distribution status, collections, and itemized expenses — no login required."
    />
    {loading && !data ? <Loading /> : !data ? <ErrorNote message={error} /> : data.length === 0 ? (
      <div className="card empty">
        <h3>No public ledgers yet</h3>
        <p>A public ledger appears here automatically once a mahallu starts a programme.</p>
      </div>
    ) : (
      <div className="stack">
        {running.length > 0 && (
          <section>
            <div className="eyebrow" style={{ marginBottom: 12 }}><span className="dot" />ACTIVE PROGRAMMES</div>
            <div className="pl-dir-grid">
              {running.map(item => (
                <Link key={item.id} to={`/transparency/${item.id}`} className="pl-dir-card active">
                  <div className="am-headrow" style={{ alignItems: 'center' }}>
                    <span className="tag live"><i />Running</span>
                    <span className="am-sub">{item.district}</span>
                  </div>
                  <div>
                    <h3>{item.name}</h3>
                    <div className="am-sub" style={{ marginTop: 4 }}>{item.mahalluName} · Udhiyya on {dateText(item.targetDate)}</div>
                  </div>
                  <span className="pl-dir-cta">Open live ledger →</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {ended.length > 0 && (
          <section>
            <div className="eyebrow" style={{ marginBottom: 12 }}><span className="dot" />COMPLETED PROGRAMMES</div>
            <div className="pl-dir-grid">
              {ended.map(item => (
                <Link key={item.id} to={`/transparency/${item.id}`} className="pl-dir-card">
                  <div className="am-headrow" style={{ alignItems: 'center' }}>
                    <span className="tag off">Ended</span>
                    <span className="am-sub">{item.district}</span>
                  </div>
                  <div>
                    <h3>{item.name}</h3>
                    <div className="am-sub" style={{ marginTop: 4 }}>{item.mahalluName} · Udhiyya on {dateText(item.targetDate)}</div>
                  </div>
                  <span className="pl-dir-cta">View archive →</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    )}
  </>;
}

export function TransparencyLedger() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const revealRoot = useRef<HTMLDivElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const { data, error, loading, refreshing, reload } = usePublicFetch<Ledger>(`/public/ledgers/${id}`);
  const index = usePublicFetch<IndexItem[]>('/public/ledgers');

  useAppReveal(revealRoot, id);

  // Auto-poll active programme every 30s so visitors see live overall updates without signing in
  useEffect(() => {
    if (!data || data.program.status !== 'OPEN') return;
    const timer = setInterval(reload, 30_000);
    return () => clearInterval(timer);
  }, [data, reload]);

  useEffect(() => {
    setSelectedCategory('ALL');
  }, [id]);

  if (loading && !data) return <Loading />;
  if (!data) return <><ErrorNote message={error} /><Link to="/transparency/all" className="am-back">← All programmes</Link></>;

  const totalAnimals = data.animals.total;
  const cumSlaughtered = data.animals.cumulative?.slaughtered ?? (data.animals.slaughtered + data.animals.processing + data.animals.packed);
  const cumProcessing = data.animals.cumulative?.processing ?? (data.animals.processing + data.animals.packed);
  const cumCompleted = data.animals.cumulative?.completed ?? data.animals.packed;
  const distribution = data.distribution ?? {
    started: data.meat.packetsHandedOut > 0,
    startedAt: null,
    packetsIssued: 0,
    packetsHandedOut: data.meat.packetsHandedOut,
    householdsServed: data.meat.householdsServed,
  };
  const liveStage: PublicStage = data.liveStage ?? (
    data.program.status === 'ENDED' ? 'ENDED' :
    distribution.started ? 'DISTRIBUTING' :
    totalAnimals > 0 && cumCompleted === totalAnimals ? 'COMPLETED' :
    cumProcessing > 0 ? 'PROCESSING' :
    cumSlaughtered > 0 ? 'SLAUGHTERING' :
    totalAnimals > 0 ? 'SCHEDULED' : 'OPEN'
  );
  const overallPct = data.overallPercent ?? (
    totalAnimals ? Math.round(((cumSlaughtered + cumProcessing + cumCompleted) / (totalAnimals * 3)) * 100) : 0
  );

  const stageState = (done: boolean, started: boolean) => (done ? 'done' : started ? 'live' : 'waiting');
  const slaughterState = stageState(totalAnimals > 0 && cumSlaughtered === totalAnimals, cumSlaughtered > 0);
  const processingState = stageState(totalAnimals > 0 && cumProcessing === totalAnimals, cumProcessing > 0);
  const completedState = stageState(totalAnimals > 0 && cumCompleted === totalAnimals, cumCompleted > 0);
  const distState = stageState(data.program.status === 'ENDED' && distribution.started, distribution.started);

  const pct = (part: number, whole: number) => (whole > 0 ? Math.min(100, Math.round((part / whole) * 100)) : 0);
  const categoryTotal = data.byCategory.reduce((sum, row) => sum + row.amount, 0);
  const liveExpenseCount = data.expenses.filter(row => !row.voidedAt).length;
  const filteredExpenses = selectedCategory === 'ALL'
    ? data.expenses
    : data.expenses.filter(row => row.category === selectedCategory);
  const filterCategories = Array.from(new Set(data.expenses.map(row => row.category)));
  const updates = data.updates ?? [];
  const byType = data.animals.byType ?? [];
  const programsList = index.data ?? [];
  const [titleHead, titleTail] = splitName(data.program.name);

  return (
    <div ref={revealRoot} className="pl-section">
      {/* 1. EDITORIAL DEEP-GREEN HERO */}
      <section className="pl-hero" aria-label="Public programme overview">
        <div className="pl-hero-top">
          <div className="pl-hero-badges">
            <span className={`pl-live-pill${data.program.status === 'ENDED' ? ' ended' : ''}`}>
              <i aria-hidden="true" />
              {data.program.status === 'OPEN' ? 'Live public updates' : 'Completed cycle'}
            </span>
            <span className="pl-mahallu-tag">
              {data.program.mahalluName} · {data.program.district}
            </span>
          </div>

          <div className="pl-hero-controls">
            {programsList.length > 1 ? (
              <select
                className="pl-switcher"
                aria-label="Switch public programme"
                value={data.program.id}
                onChange={event => navigate(`/transparency/${event.target.value}`)}
              >
                {programsList.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} · {item.status === 'OPEN' ? 'Active' : 'Ended'}
                  </option>
                ))}
              </select>
            ) : (
              <Link to="/transparency/all" className="pl-hero-btn">All programmes</Link>
            )}
            <button
              type="button"
              className={`pl-hero-btn${refreshing ? ' spinning' : ''}`}
              onClick={reload}
              aria-label="Refresh live ledger"
              title="Refresh live updates"
            >
              <IconRefresh />
              <span>{refreshing ? 'Updating…' : `Updated ${new Date(data.generatedAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`}</span>
            </button>
          </div>
        </div>

        <h1>
          {titleHead}
          {titleTail ? <span className="serif">{titleTail}</span> : null}
        </h1>
        <p className="pl-hero-lead">{stageHeadline(data, liveStage)}</p>

        <div className="pl-hero-meta">
          <div className="pl-hero-pill">
            <span>Current stage</span>
            <b>{STAGE_LABELS[liveStage]}</b>
          </div>
          <div className="pl-hero-pill">
            <span>Overall animal progress</span>
            <b><AnimatedNumber value={overallPct} />% · {cumCompleted} / {totalAnimals} packed</b>
          </div>
          <div className="pl-hero-pill">
            <span>Public transparency</span>
            <b>Aggregate only · No login needed</b>
          </div>
        </div>
      </section>

      {/* 2. LIVE OVERALL OPERATIONS — SLAUGHTER, PROCESSING, COMPLETED & DISTRIBUTION */}
      <section className="card" aria-label="Overall animal and distribution progress">
        <div className="pl-ops-head">
          <div>
            <div className="eyebrow"><span className="dot" />OVERALL LIVE OPERATIONS · NOT PERSON-BASED</div>
            <h2>Slaughter to <span className="serif">distribution</span></h2>
          </div>
          <div className="pl-ops-overall">
            <span>Overall completion</span>
            <b><AnimatedNumber value={overallPct} />%</b>
          </div>
        </div>

        <div className="pl-stages" role="list" aria-label="Overall stages">
          {/* Stage 1: Slaughter */}
          <article className={`pl-stage ${slaughterState}`} role="listitem">
            <div className="pl-stage-top">
              <span className="pl-stage-icon" aria-hidden="true"><IconKnife /></span>
              <span className="pl-stage-badge">
                {slaughterState === 'done' ? 'Completed' : slaughterState === 'live' ? 'In progress' : 'Waiting'}
              </span>
            </div>
            <div className="pl-stage-title">1. Animal Slaughter</div>
            <div className="pl-stage-metric">
              <AnimatedNumber value={cumSlaughtered} /> <small>/ {totalAnimals}</small>
            </div>
            <div className="progress">
              <i style={{ width: `${pct(cumSlaughtered, totalAnimals)}%` }} />
            </div>
            <div className="pl-stage-note">
              {totalAnimals === 0
                ? 'Waiting for animal schedule'
                : data.animals.pending && data.animals.pending > 0
                  ? `${data.animals.pending} remaining in queue`
                  : 'All scheduled animals slaughtered'}
            </div>
            {data.animals.milestones?.slaughterStartedAt && (
              <div className="pl-stage-time">
                {data.animals.milestones.slaughterCompletedAt
                  ? `Done ${shortTime(data.animals.milestones.slaughterCompletedAt)}`
                  : `Started ${shortTime(data.animals.milestones.slaughterStartedAt)}`}
              </div>
            )}
          </article>

          {/* Stage 2: Processing */}
          <article className={`pl-stage ${processingState}`} role="listitem">
            <div className="pl-stage-top">
              <span className="pl-stage-icon" aria-hidden="true"><IconCut /></span>
              <span className="pl-stage-badge">
                {processingState === 'done' ? 'Completed' : processingState === 'live' ? 'Active' : 'Waiting'}
              </span>
            </div>
            <div className="pl-stage-title">2. Processing</div>
            <div className="pl-stage-metric">
              <AnimatedNumber value={cumProcessing} /> <small>/ {totalAnimals}</small>
            </div>
            <div className="progress">
              <i style={{ width: `${pct(cumProcessing, totalAnimals)}%` }} />
            </div>
            <div className="pl-stage-note">
              {data.animals.processing > 0
                ? `${data.animals.processing} currently being cut & weighed`
                : processingState === 'done'
                  ? 'All animals processed'
                  : 'Cutting & weighing begins after slaughter'}
            </div>
            {data.animals.milestones?.processingStartedAt && (
              <div className="pl-stage-time">
                {data.animals.milestones.processingCompletedAt
                  ? `Done ${shortTime(data.animals.milestones.processingCompletedAt)}`
                  : `Started ${shortTime(data.animals.milestones.processingStartedAt)}`}
              </div>
            )}
          </article>

          {/* Stage 3: Completed & Packed */}
          <article className={`pl-stage ${completedState}`} role="listitem">
            <div className="pl-stage-top">
              <span className="pl-stage-icon" aria-hidden="true"><IconPackage /></span>
              <span className="pl-stage-badge">
                {completedState === 'done' ? 'Completed' : completedState === 'live' ? 'Packing' : 'Waiting'}
              </span>
            </div>
            <div className="pl-stage-title">3. Completed &amp; Packed</div>
            <div className="pl-stage-metric">
              <AnimatedNumber value={cumCompleted} /> <small>/ {totalAnimals}</small>
            </div>
            <div className="progress">
              <i style={{ width: `${pct(cumCompleted, totalAnimals)}%` }} />
            </div>
            <div className="pl-stage-note">
              {completedState === 'done'
                ? 'All animals packed & ready for handover'
                : `${pct(cumCompleted, totalAnimals)}% of animals fully completed`}
            </div>
            {data.animals.milestones?.packingStartedAt && (
              <div className="pl-stage-time">
                {data.animals.milestones.packingCompletedAt
                  ? `Done ${shortTime(data.animals.milestones.packingCompletedAt)}`
                  : `Started ${shortTime(data.animals.milestones.packingStartedAt)}`}
              </div>
            )}
          </article>

          {/* Stage 4: Distribution */}
          <article className={`pl-stage ${distState}`} role="listitem">
            <div className="pl-stage-top">
              <span className="pl-stage-icon" aria-hidden="true"><IconTruck /></span>
              <span className="pl-stage-badge">
                {distState === 'done' ? 'Finished' : distState === 'live' ? 'Started' : 'Not started'}
              </span>
            </div>
            <div className="pl-stage-title">4. Distribution</div>
            <div className="pl-stage-metric">
              {distribution.started ? <AnimatedNumber value={distribution.packetsHandedOut} /> : 'Pending'}
              {distribution.started && <small> {distribution.packetsHandedOut === 1 ? 'pkt' : 'pkts'}</small>}
            </div>
            <div className="progress">
              <i style={{
                width: `${distribution.started
                  ? (distribution.packetsIssued > 0 ? pct(distribution.packetsHandedOut, distribution.packetsIssued) : 100)
                  : 0}%`,
              }} />
            </div>
            <div className="pl-stage-note">
              {distribution.started
                ? `${distribution.householdsServed} ${distribution.householdsServed === 1 ? 'household' : 'households'} served${distribution.packetsIssued > 0 ? ` · ${distribution.packetsIssued} issued` : ''}`
                : 'Distribution update will appear here once started'}
            </div>
            {distribution.startedAt && (
              <div className="pl-stage-time">Started {shortTime(distribution.startedAt)}</div>
            )}
          </article>
        </div>

        {/* Overall Updates Timeline + Aggregate Animal Breakdown */}
        <div className="pl-ops-split">
          <div>
            <h3 className="pl-subhead">
              Overall live updates
              <span>Public broadcast · auto-refreshes every 30s</span>
            </h3>
            <ol className="pl-feed">
              {updates.map(item => (
                <li key={item.id} className={`pl-feed-item${item.state === 'live' ? ' live' : ''}`}>
                  <div className="pl-feed-top">
                    <b>{item.title}</b>
                    {item.at && <time dateTime={item.at}>{shortTime(item.at)}</time>}
                  </div>
                  <p>{item.detail}</p>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <h3 className="pl-subhead">
              Overall by animal type
              <span>{totalAnimals} total</span>
            </h3>
            {byType.length === 0 ? (
              <div className="pl-type-card">
                <p className="am-note" style={{ padding: 0 }}>Animal breakdown appears once allocation is finalized.</p>
              </div>
            ) : (
              <div className="pl-types">
                {byType.map(row => {
                  const done = row.packed;
                  const slaughteredAny = row.slaughtered + row.processing + row.packed;
                  const name = animalLabel[row.animalType as AnimalType] ?? row.animalType;
                  return (
                    <div key={row.animalType} className="pl-type-card">
                      <div className="pl-type-top">
                        <b>{name}</b>
                        <span>{done} / {row.total} completed</span>
                      </div>
                      <div className="progress">
                        <i style={{ width: `${pct(done, row.total)}%` }} />
                      </div>
                      <div className="pl-type-pills">
                        <span>Slaughtered: {slaughteredAny}</span>
                        <span>Processing: {row.processing}</span>
                        <span>Packed: {row.packed}</span>
                        {row.pending > 0 && <span>Queued: {row.pending}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. FINANCIAL SUMMARY STRIP */}
      <div className="pl-kpis" role="list" aria-label="Financial summary" data-app-stagger="">
        <div className="pl-kpi" role="listitem">
          <div className="pl-kpi-head">
            <div className="eyebrow">Collected</div>
            <span className="ic" aria-hidden="true"><IconWallet /></span>
          </div>
          <div className="pl-kpi-val pos"><AnimatedNumber value={data.collected} format={inr} /></div>
          <div className="pl-kpi-sub">{data.payments} confirmed {data.payments === 1 ? 'payment' : 'payments'}</div>
        </div>

        <div className="pl-kpi" role="listitem">
          <div className="pl-kpi-head">
            <div className="eyebrow">Spent</div>
            <span className="ic amber" aria-hidden="true"><IconReceipt /></span>
          </div>
          <div className="pl-kpi-val"><AnimatedNumber value={data.spent} format={inr} /></div>
          <div className="pl-kpi-sub">{liveExpenseCount} {liveExpenseCount === 1 ? 'expense' : 'expenses'} recorded</div>
        </div>

        <div className="pl-kpi" role="listitem">
          <div className="pl-kpi-head">
            <div className="eyebrow">Balance</div>
            <span className={`ic ${data.balance < 0 ? 'coral' : ''}`} aria-hidden="true"><IconChart /></span>
          </div>
          <div className={`pl-kpi-val ${data.balance < 0 ? 'neg' : 'pos'}`}>
            <AnimatedNumber value={data.balance} format={signedInr} />
          </div>
          <div className="pl-kpi-sub">{data.balance < 0 ? 'committee advance' : 'held by the committee'}</div>
        </div>

        <div className="pl-kpi" role="listitem">
          <div className="pl-kpi-head">
            <div className="eyebrow">Meat distributed</div>
            <span className="ic" aria-hidden="true"><IconHand /></span>
          </div>
          <div className="pl-kpi-val"><AnimatedNumber value={distribution.packetsHandedOut} /></div>
          <div className="pl-kpi-sub">
            {distribution.packetsHandedOut === 1 ? 'packet' : 'packets'} to {distribution.householdsServed}{' '}
            {distribution.householdsServed === 1 ? 'household' : 'households'}
          </div>
        </div>
      </div>

      {/* 4. SPENDING BREAKDOWN & ITEMIZED EXPENSES */}
      <div className="pl-fin-grid" data-app-reveal="">
        <section className="card" aria-label="Spending by category">
          <div className="eyebrow"><span className="dot" />SPENDING BREAKDOWN</div>
          <h2 style={{ fontSize: 22, margin: '8px 0 16px' }}>By <span className="serif">category</span></h2>
          {data.byCategory.length === 0 ? (
            <p className="am-note">No expenses recorded yet.</p>
          ) : (
            <>
              <div className="pl-segbar" aria-hidden="true">
                {data.byCategory.map(row => (
                  <span
                    key={row.category}
                    style={{
                      width: `${categoryTotal ? (row.amount / categoryTotal) * 100 : 0}%`,
                      background: CATEGORY_COLORS[row.category] ?? '#0e5c48',
                    }}
                  />
                ))}
              </div>
              <div className="pl-cat-list">
                {data.byCategory.map(row => {
                  const share = categoryTotal ? Math.round((row.amount / categoryTotal) * 100) : 0;
                  const color = CATEGORY_COLORS[row.category] ?? '#0e5c48';
                  return (
                    <div key={row.category} className="pl-cat-row">
                      <div className="pl-cat-top">
                        <span className="pl-cat-name">
                          <i className="pl-cat-dot" style={{ background: color }} aria-hidden="true" />
                          {categoryLabel[row.category] ?? row.category}
                        </span>
                        <span className="pl-cat-amt">
                          <b>{inr(row.amount)}</b>
                          <small>{share}%</small>
                        </span>
                      </div>
                      <div className="progress" role="img" aria-label={`${categoryLabel[row.category] ?? row.category} ${share} percent`}>
                        <i style={{ width: `${categoryTotal ? (row.amount / categoryTotal) * 100 : 0}%`, background: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>

        <section className="card" aria-label="Every expense">
          <div className="am-headrow" style={{ alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div className="eyebrow"><span className="dot" />OPEN LEDGER</div>
              <h2 style={{ fontSize: 22, marginTop: 6 }}>Every <span className="serif">expense</span></h2>
            </div>
            <span className="tag pl-audited-tag"><IconShield />Audited public record</span>
          </div>

          {filterCategories.length > 1 && (
            <div className="pl-filters" role="group" aria-label="Filter expenses by category">
              <button
                type="button"
                className={`pl-filter-chip${selectedCategory === 'ALL' ? ' on' : ''}`}
                onClick={() => setSelectedCategory('ALL')}
              >
                All ({data.expenses.length})
              </button>
              {filterCategories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  className={`pl-filter-chip${selectedCategory === cat ? ' on' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {categoryLabel[cat] ?? cat}
                </button>
              ))}
            </div>
          )}

          {filteredExpenses.length === 0 ? (
            <div className="empty"><h3>No expenses recorded yet</h3></div>
          ) : (
            <div className="tx-wrap">
              <table className="tx">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Expense</th>
                    <th>Category</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map(row => (
                    <tr key={row.id} style={row.voidedAt ? { opacity: 0.6 } : undefined}>
                      <td style={{ whiteSpace: 'nowrap' }}>{dateText(row.spentOn)}</td>
                      <td>
                        <b style={row.voidedAt ? { textDecoration: 'line-through' } : undefined}>{row.title}</b>
                        {row.voidedAt && <span className="pl-void-tag">Voided</span>}
                        {(row.voidedAt ? row.voidReason : row.note) && (
                          <div className="am-sub">{row.voidedAt ? `Reason: ${row.voidReason}` : row.note}</div>
                        )}
                      </td>
                      <td><span className="tag">{categoryLabel[row.category] ?? row.category}</span></td>
                      <td className="amt" style={{ textAlign: 'right' }}>{inr(row.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
