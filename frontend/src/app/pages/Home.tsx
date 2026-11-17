import { useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/auth';
import { AnimatedNumber, useAppReveal } from '../../features/motion/primitives';
import { greeting, shortMahallu, useApp, useWide } from '../lib/app-context';
import { inr, type MyProgram } from '../lib/programs';
import { IconCard, IconChart, IconDoc, IconHand, IconHeart, IconShield, IconUsers } from '../ui/Icons';
import { useFetch } from '../ui/kit';
import { KnowMore } from '../ui/KnowMore';
import { ActivityChart, type MonthlyPoint } from '../ui/ActivityChart';
import { RightRail, type ActivityItem } from '../ui/RightRail';
import { MemberDashboard } from './MemberDashboard';
import { VolunteerDashboard } from './VolunteerDashboard';
import { skipKey } from './Welcome';

type Mahallu = { id: string; active: boolean; households: number; admins: unknown[] };
type ProgramRow = { id: string; name: string; status: 'DRAFT' | 'OPEN' | 'ENDED'; bookings: number };
type Households = { total: number; linked: number; people: number };
type ProgramSummary = {
  money: { expected: number; collected: number; outstanding: number; spent: number; balance: number };
  monthly?: MonthlyPoint[];
};
type TransactionEntry = {
  id: string;
  at: string;
  type: 'PAYMENT' | 'EXPENSE' | 'MEAT_ISSUE' | 'DISTRIBUTION';
  title: string;
  detail: string;
  amount: number | null;
  packets: number | null;
  status: string;
};

function mapTransactions(rows: TransactionEntry[] | null): ActivityItem[] {
  if (!rows) return [];
  return rows.slice(0, 5).map(row => {
    if (row.type === 'PAYMENT') {
      const confirmed = row.status === 'CONFIRMED';
      return {
        icon: 'heart',
        title: row.title,
        detail: row.detail,
        amount: confirmed ? `+${inr(row.amount ?? 0)}` : row.status === 'PENDING' ? 'Pending' : 'Voided',
        isPlus: confirmed,
      };
    }
    if (row.type === 'EXPENSE') {
      const voided = row.status === 'VOIDED';
      return {
        icon: 'shield',
        title: row.title,
        detail: row.detail,
        amount: voided ? 'Voided' : `−${inr(row.amount ?? 0)}`,
        isPlus: false,
      };
    }
    return {
      icon: 'hand',
      title: row.title,
      detail: row.detail,
      amount: `${row.packets ?? 0} pkts`,
      isPlus: true,
    };
  });
}

export function Home() {
  const { user } = useAuth();
  const { ctx, isSuper, activeMahallu, volunteer } = useApp();
  const wide = useWide();
  const revealRoot = useRef<HTMLDivElement>(null);
  const house = ctx?.households[0];
  const plainMember = !isSuper && !activeMahallu && !volunteer;
  const mine = useFetch<MyProgram[]>(house ? '/me/programs' : null);

  // Fetch real admin or superadmin stats from API
  const adminHouseholds = useFetch<Households>(activeMahallu ? `/mahallus/${activeMahallu.mahalluId}/households` : null);
  const adminPrograms = useFetch<ProgramRow[]>(activeMahallu ? `/mahallus/${activeMahallu.mahalluId}/programs` : null);
  const currentProgram = adminPrograms.data?.find(item => item.status !== 'ENDED') ?? adminPrograms.data?.[0];
  const adminSummary = useFetch<ProgramSummary>(activeMahallu && currentProgram ? `/programs/${currentProgram.id}/summary` : null);
  const adminTx = useFetch<TransactionEntry[]>(activeMahallu && currentProgram ? `/programs/${currentProgram.id}/transactions` : null);
  const superMahallus = useFetch<Mahallu[]>(isSuper ? '/mahallus' : null);

  useAppReveal(revealRoot, wide);

  if (!user || !ctx) return null;
  if (volunteer) return <VolunteerDashboard />;

  // A member who has not chosen anything yet is taken through the first-login slides.
  if (plainMember && sessionStorage.getItem(skipKey) !== '1') {
    if (!house) return <Navigate to="/app/welcome" replace />;
    if (mine.data && mine.data.some(item => item.status === 'OPEN') && !mine.data.some(item => item.bookings.length > 0)) {
      return <Navigate to="/app/welcome" replace />;
    }
  }

  // Members get the full personal dashboard once they have chosen an animal.
  if (plainMember && mine.data && mine.data.some(item => item.bookings.length > 0)) {
    return <MemberDashboard programs={mine.data} reload={mine.reload} />;
  }

  const nameParts = user.name.trim().split(/\s+/);
  const firstName = nameParts[0] || 'Member';
  const lastName = nameParts.slice(1).join(' ');
  const place = shortMahallu(activeMahallu?.mahalluName ?? house?.mahalluName);
  const roleBadge = isSuper ? 'Super Admin' : activeMahallu ? 'Mahallu Admin' : house ? 'Verified Member' : 'Member';

  const heroLabel = activeMahallu
    ? `EID AL-ADHA · ${(currentProgram?.name ?? 'NO ACTIVE PROGRAMME').toUpperCase()}`
    : isSuper
      ? 'EID NETWORK · TOTAL MAHALLUS'
      : 'UDHIYYA SAVINGS · TOTAL CONTRIBUTED';

  const activeMahallusCount = superMahallus.data?.filter(item => item.active).length ?? 0;

  const heroFigure = activeMahallu
    ? <><AnimatedNumber value={currentProgram?.bookings ?? 0} /> {currentProgram?.bookings === 1 ? 'Booking' : 'Bookings'}</>
    : isSuper
      ? <><AnimatedNumber value={activeMahallusCount} /> Active</>
      : <>₹<AnimatedNumber value={0} /></>;

  const activityLink = activeMahallu ? '/app/manage/ledger' : isSuper ? '/transparency' : '/app/payments';
  const recentActivities = activeMahallu ? mapTransactions(adminTx.data) : [];
  const goalRaised = activeMahallu ? (adminSummary.data?.money.collected ?? 0) : 0;
  const goalTarget = activeMahallu ? (adminSummary.data?.money.expected ?? 0) : 0;
  const goalPct = goalTarget > 0 ? Math.min(100, Math.round((goalRaised / goalTarget) * 100)) : 0;
  const goalTitle = activeMahallu ? `${currentProgram?.name ?? 'Programme'} collection` : 'Udhiyya collection';

  // Mobile Home — exact pixel reproduction of base design MobileShell home screen
  if (!wide) {
    return (
      <div ref={revealRoot}>
        {/* Balance / Overview Card */}
        <section className="mbalance" aria-label="Udhiyya overview">
          <div className="lbl">{heroLabel}</div>
          <div className="bal">{heroFigure}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', position: 'relative', zIndex: 1 }}>
            <span className="tag" style={{ background: 'rgba(255,255,255,.16)', color: '#fff' }}>
              {roleBadge}
            </span>
            <span style={{ fontSize: 12.5, color: '#bfe0d1' }}>{place}</span>
          </div>
        </section>

        {/* Quick Action Chips */}
        <div className="mchips" role="group" aria-label="Quick actions">
          {activeMahallu ? (
            <>
              <Link className="primary" to="/app/members">
                <IconUsers />
                <span>Manage members</span>
              </Link>
              <Link to="/app/manage/programs">
                <IconDoc />
                <span>Programs</span>
              </Link>
              <Link to="/app/volunteers">
                <IconHand />
                <span>Volunteers</span>
              </Link>
              <Link to="/app/manage/ledger">
                <IconChart />
                <span>Ledger</span>
              </Link>
            </>
          ) : isSuper ? (
            <>
              <Link className="primary" to="/app/mahallus">
                <IconShield />
                <span>Manage mahallus</span>
              </Link>
              <Link to="/transparency">
                <IconChart />
                <span>Public ledgers</span>
              </Link>
              <Link to="/app/profile">
                <IconUsers />
                <span>Profile</span>
              </Link>
            </>
          ) : (
            <>
              <Link className="primary" to="/app/welcome">
                <IconHeart />
                <span>{house ? 'Choose animal' : 'Link household'}</span>
              </Link>
              <Link to="/app/tracking">
                <IconDoc />
                <span>Track animal</span>
              </Link>
              <Link to="/app/payments">
                <IconCard />
                <span>Payments</span>
              </Link>
            </>
          )}
        </div>

        {/* 2-Card Summary Stats */}
        <div className="t2col">
          <section className="mcard" style={{ marginTop: 14 }}>
            <div className="eyebrow">{activeMahallu ? 'Households' : isSuper ? 'Mahallus' : 'Total Contributed'}</div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 23, color: 'var(--ink2)', marginTop: 6 }}>
              {activeMahallu
                ? <AnimatedNumber value={adminHouseholds.data?.total ?? 0} />
                : isSuper
                  ? <AnimatedNumber value={superMahallus.data?.length ?? 0} />
                  : <>₹<AnimatedNumber value={0} /></>}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
              {activeMahallu ? 'registered members' : isSuper ? 'registered mahallus' : 'Eid Udhiyya savings'}
            </div>
          </section>

          <section className="mcard" style={{ marginTop: 14 }}>
            <div className="eyebrow">{activeMahallu ? 'People' : isSuper ? 'Households' : 'My Shares'}</div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 23, color: 'var(--ink2)', marginTop: 6 }}>
              {activeMahallu
                ? <AnimatedNumber value={adminHouseholds.data?.people ?? 0} />
                : isSuper
                  ? <AnimatedNumber value={superMahallus.data?.reduce((s, item) => s + item.households, 0) ?? 0} />
                  : '0 shares'}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
              {activeMahallu ? 'across all houses' : isSuper ? 'across all mahallus' : 'No active booking yet'}
            </div>
          </section>
        </div>

        {/* Distribution Goal */}
        <section className="msec" data-app-reveal="">
          <div className="msec-head">
            <h2>Udhiyya <span className="serif">goal</span></h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="tag"><AnimatedNumber value={goalPct} />%</span>
              <KnowMore title={goalTitle} ariaLabel="Know more about collection goal">
                <p style={{ margin: 0 }}>
                  Confirmed Udhiyya contributions collected against total expected shares for {place}.
                </p>
              </KnowMore>
            </div>
          </div>
          <div className="mcard">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <b style={{ color: 'var(--ink2)' }}>{goalTitle}</b>
              <span style={{ color: 'var(--muted)' }}>{inr(goalRaised)} of {inr(goalTarget)}</span>
            </div>
            <div className="progress" style={{ marginTop: 12 }}>
              <i style={{ width: `${goalPct}%` }}></i>
            </div>
          </div>
        </section>

        {/* Eid Insight */}
        <section className="msec" data-app-reveal="">
          <div className="mcard" style={{ background: 'var(--bg2)', border: '1.5px solid var(--mint-soft)', boxShadow: 'none' }}>
            <div className="eyebrow">
              <span className="dot"></span>EID INSIGHT
            </div>
            <p style={{ fontSize: 15.5, color: 'var(--ink2)', marginTop: 8 }}>
              “Your Udhiyya contributions and shares are distributed directly to eligible families across your Mahallu for Eid.”
            </p>
          </div>
        </section>

        {/* Recent Activity */}
        <section className="msec" data-app-reveal="">
          <div className="msec-head">
            <h2>Recent <span className="serif">activity</span></h2>
            <Link to={activityLink}>See all</Link>
          </div>
          <div className="mcard" style={{ padding: '8px 18px' }}>
            {recentActivities.length === 0 ? (
              <p style={{ fontSize: 13.5, color: 'var(--muted)', padding: '12px 0', margin: 0 }}>
                No recent activity yet.
              </p>
            ) : (
              recentActivities.map((a, i) => (
                <div key={i} className="act-row">
                  <span className={`ic ${a.cls ?? ''}`}>
                    {a.icon === 'hand' ? <IconHand /> : a.icon === 'shield' ? <IconShield /> : <IconHeart />}
                  </span>
                  <div className="grow">
                    <div className="t">{a.title}</div>
                    {a.detail && <div className="d">{a.detail}</div>}
                  </div>
                  <div className={`amt ${a.isPlus ? 'plus' : ''}`}>{a.amount}</div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    );
  }

  // Desktop Dashboard — exact pixel reproduction of base design DesktopShell dashboard view
  return (
    <div className="dgrid" ref={revealRoot}>
      {/* Left Main Column */}
      <div>
        {/* Hero Panel */}
        <section className="hero-panel" aria-label="Welcome">
          <span className="tag live">
            <i />
            {place} · {roleBadge}
          </span>
          <h1 style={{ marginTop: 16 }}>
            {greeting()}, {firstName}
            {lastName ? <> <span className="serif">{lastName}.</span></> : '.'}
          </h1>
          <p className="sub">
            {isSuper
              ? `Your Udhiyya administration overview for ${place} — create mahallus and give committees access.`
              : activeMahallu
                ? `Your Udhiyya overview for ${place} — manage members, programs, and verified meat distribution.`
                : `Your Udhiyya overview for ${place} — every contribution verified, every distribution tracked.`}
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 22, position: 'relative', zIndex: 1 }}>
            {activeMahallu ? (
              <>
                <Link className="pillbtn light" to="/app/members">
                  Manage members
                </Link>
                <Link
                  className="pillbtn"
                  style={{ background: 'rgba(255,255,255,.14)', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,.4)' }}
                  to="/app/manage/programs"
                >
                  Programs
                </Link>
                <Link
                  className="pillbtn"
                  style={{ background: 'rgba(255,255,255,.14)', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,.4)' }}
                  to="/app/manage/ledger"
                >
                  View Ledger
                </Link>
              </>
            ) : isSuper ? (
              <>
                <Link className="pillbtn light" to="/app/mahallus">
                  Manage mahallus
                </Link>
                <Link
                  className="pillbtn"
                  style={{ background: 'rgba(255,255,255,.14)', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,.4)' }}
                  to="/transparency"
                >
                  Public ledgers
                </Link>
                <Link
                  className="pillbtn"
                  style={{ background: 'rgba(255,255,255,.14)', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,.4)' }}
                  to="/app/profile"
                >
                  Profile
                </Link>
              </>
            ) : (
              <>
                <Link className="pillbtn light" to="/app/welcome">
                  {house ? 'Choose my animal' : 'Link household'}
                </Link>
                <Link
                  className="pillbtn"
                  style={{ background: 'rgba(255,255,255,.14)', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,.4)' }}
                  to="/app/tracking"
                >
                  Track my animal
                </Link>
                <Link
                  className="pillbtn"
                  style={{ background: 'rgba(255,255,255,.14)', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,.4)' }}
                  to="/app/payments"
                >
                  Payments
                </Link>
              </>
            )}
          </div>

          {/* Bottom Metric Banner inside Hero Panel */}
          <div style={{ marginTop: 26, position: 'relative', zIndex: 1 }}>
            <div className="lbl" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.16em', color: '#a9d4c2' }}>
              {heroLabel}
            </div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 42, letterSpacing: '-.02em' }}>
              {heroFigure}
            </div>
          </div>
        </section>

        {/* 4 Stat Cards */}
        <div className="stat-grid" role="list" aria-label="Your totals">
          {activeMahallu ? (
            <>
              <div className="stat" role="listitem">
                <div className="eyebrow">Households</div>
                <div className="v"><AnimatedNumber value={adminHouseholds.data?.total ?? 0} /></div>
                <div className="s">registered members</div>
              </div>

              <div className="stat" role="listitem">
                <div className="eyebrow">People</div>
                <div className="v"><AnimatedNumber value={adminHouseholds.data?.people ?? 0} /></div>
                <div className="s">across all houses</div>
              </div>

              <div className="stat" role="listitem">
                <div className="eyebrow">Signed Up</div>
                <div className="v"><AnimatedNumber value={adminHouseholds.data?.linked ?? 0} /></div>
                <div className="s">{Math.max(0, (adminHouseholds.data?.total ?? 0) - (adminHouseholds.data?.linked ?? 0))} not yet linked</div>
              </div>

              <div className="stat" role="listitem">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="eyebrow" style={{ margin: 0 }}>Active Program</div>
                  <KnowMore title="Active Udhiyya Program" ariaLabel="Know more about active program">
                    <p style={{ margin: 0 }}>
                      Current Udhiyya season managed by {place} committee. All bookings and distributions are audited locally.
                    </p>
                  </KnowMore>
                </div>
                <div className="v" style={{ fontSize: 21, paddingTop: 5 }}>{currentProgram?.name ?? 'None yet'}</div>
                <div className="s">{currentProgram ? `${currentProgram.status === 'OPEN' ? 'Open' : currentProgram.status === 'ENDED' ? 'Ended' : 'Draft'} · ${currentProgram.bookings} ${currentProgram.bookings === 1 ? 'booking' : 'bookings'}` : 'start under Programs'}</div>
              </div>
            </>
          ) : isSuper ? (
            <>
              <div className="stat" role="listitem">
                <div className="eyebrow">Mahallus</div>
                <div className="v"><AnimatedNumber value={superMahallus.data?.length ?? 0} /></div>
                <div className="s">{superMahallus.data?.filter(i => i.active).length ?? 0} active</div>
              </div>

              <div className="stat" role="listitem">
                <div className="eyebrow">Households</div>
                <div className="v"><AnimatedNumber value={superMahallus.data?.reduce((sum, item) => sum + item.households, 0) ?? 0} /></div>
                <div className="s">across all mahallus</div>
              </div>

              <div className="stat" role="listitem">
                <div className="eyebrow">Admins</div>
                <div className="v"><AnimatedNumber value={superMahallus.data?.reduce((sum, item) => sum + item.admins.length, 0) ?? 0} /></div>
                <div className="s">with committee access</div>
              </div>

              <div className="stat" role="listitem">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="eyebrow" style={{ margin: 0 }}>Network Status</div>
                  <KnowMore title="Mahallu Network" ariaLabel="Know more about network status">
                    <p style={{ margin: 0 }}>
                      All active Mahallus are verified and publishing real-time Udhiyya distribution records.
                    </p>
                  </KnowMore>
                </div>
                <div className="v" style={{ fontSize: 21, paddingTop: 5 }}>Verified Active</div>
                <div className="s">{superMahallus.data?.filter(i => !i.active).length ?? 0} inactive</div>
              </div>
            </>
          ) : (
            <>
              <div className="stat" role="listitem">
                <div className="eyebrow">Total Contributed</div>
                <div className="v">₹<AnimatedNumber value={0} /></div>
                <div className="s">Eid Udhiyya savings</div>
              </div>

              <div className="stat" role="listitem">
                <div className="eyebrow">My Shares</div>
                <div className="v">0 shares</div>
                <div className="s">No active booking yet</div>
              </div>

              <div className="stat" role="listitem">
                <div className="eyebrow">Distribution</div>
                <div className="v" style={{ fontSize: 21, paddingTop: 5 }}>Not booked</div>
                <div className="s">Choose an animal to begin</div>
              </div>

              <div className="stat" role="listitem">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="eyebrow" style={{ margin: 0 }}>Mahallu Status</div>
                  <KnowMore title="Mahallu Verification" ariaLabel="Know more about Mahallu status">
                    <p style={{ margin: 0 }}>
                      {house
                        ? `Active membership verified with ${place} committee. All records are audited and reconciled locally.`
                        : 'Link your household number to participate in your Mahallu Udhiyya programme.'}
                    </p>
                  </KnowMore>
                </div>
                <div className="v" style={{ fontSize: 21, paddingTop: 5 }}>{house ? 'Verified Member' : 'Not linked'}</div>
                <div className="s">{house ? place : 'Link household'}</div>
              </div>
            </>
          )}
        </div>

        {/* Mahallu Monthly Collection Activity Chart */}
        <section className="card" style={{ marginTop: 22 }} aria-label="Activity chart" data-app-reveal="">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div className="eyebrow">
                <span className="dot"></span>MONTHLY COLLECTIONS
              </div>
              <h2 style={{ fontSize: 22, marginTop: 8 }}>
                Your community, <span className="serif">sharing</span> together.
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="tag">{currentProgram ? currentProgram.name : place}</span>
              <KnowMore title="Monthly Collections" ariaLabel="Know more about monthly collections">
                <p style={{ margin: 0 }}>
                  Confirmed cash and online Udhiyya payments grouped by month from live database records.
                </p>
              </KnowMore>
            </div>
          </div>
          <div style={{ marginTop: 18 }}>
            <ActivityChart
              data={activeMahallu ? adminSummary.data?.monthly : []}
              emptyText={
                activeMahallu
                  ? 'Confirmed payments for this programme will appear here by month as members contribute.'
                  : isSuper
                    ? 'Open a Mahallu programme ledger to inspect live monthly collections.'
                    : 'Choose an animal and record a contribution to see your programme progress.'
              }
            />
          </div>
        </section>
      </div>

      {/* Right Sticky Rail */}
      <RightRail
        goalTitle={goalTitle}
        goalRaised={goalRaised}
        goalTarget={goalTarget}
        goalLabel="UDHIYYA COLLECTION"
        insightQuote="“Your Udhiyya contributions and shares are distributed directly to eligible families across your Mahallu for Eid.”"
        insightLabel="EID INSIGHT"
        activityLink={activityLink}
        activities={recentActivities}
      />
    </div>
  );
}
