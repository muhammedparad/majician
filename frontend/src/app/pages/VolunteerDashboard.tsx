import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/auth';
import { greeting } from '../lib/app-context';
import { IconChevronRight, IconCheck, IconClock, IconPackage, IconUsers } from '../ui/Icons';
import { IconClipboard, IconEdit, IconGear, IconPlus } from '../ui/icons3';
import { IconAnimal, IconPulse, IconTruck } from '../ui/more-icons';
import { ErrorNote, Loading, useFetch } from '../ui/kit';
import { KnowMore } from '../ui/KnowMore';
import { RightRail } from '../ui/RightRail';

type Overview = {
  volunteer: { name: string; mahalluName: string; canStatus: boolean; canDistribute: boolean };
  program: { id: string; name: string; status: string } | null;
  animals: { total: number; pending: number; slaughtered: number; processing: number; packed: number };
  meat: { issued: number; distributed: number; inHand: number; programDistributed: number };
};

function Task({ to, icon, title, text, badge, tone }: { to: string; icon: ReactNode; title: string; text: string; badge?: string; tone?: 'amber' }) {
  return (
    <Link to={to} className="am-task">
      <span className="am-tile sm">{icon}</span>
      <span className="am-task-text"><b>{title}</b><span>{text}</span></span>
      {badge && <span className={'am-pill' + (tone ? ' ' + tone : '')}>{badge}</span>}
      <IconChevronRight />
    </Link>
  );
}

/** The volunteer's home: today's tasks and how the whole programme is going. */
export function VolunteerDashboard() {
  const { user } = useAuth();
  const { data, error, loading } = useFetch<Overview>('/volunteer/overview');
  if (loading && !data) return <Loading />;
  if (!data) return <ErrorNote message={error} />;
  const { volunteer, program, animals, meat } = data;
  const notPacked = animals.total - animals.packed;
  const atLeast = { slaughtered: animals.slaughtered + animals.processing + animals.packed, processing: animals.processing + animals.packed, packed: animals.packed };
  const percent = animals.total ? Math.round((atLeast.slaughtered + atLeast.processing + atLeast.packed) / (animals.total * 3) * 100) : 0;
  const stages = [
    { label: 'Slaughtered', value: `${atLeast.slaughtered} / ${animals.total}`, done: animals.total > 0 && atLeast.slaughtered === animals.total, icon: <IconCheck /> },
    { label: 'Processing', value: `${atLeast.processing} / ${animals.total}`, done: animals.total > 0 && atLeast.processing === animals.total, icon: <IconGear /> },
    { label: 'Packed', value: `${atLeast.packed} / ${animals.total}`, done: animals.total > 0 && atLeast.packed === animals.total, icon: <IconPackage /> },
    { label: 'Distributed', value: `${meat.programDistributed} ${meat.programDistributed === 1 ? 'packet' : 'packets'}`, done: false, icon: <IconTruck /> },
  ];

  const nameParts = (user?.name || '').split(' ');
  const firstName = nameParts[0] || 'Volunteer';
  const lastName = nameParts.slice(1).join(' ');
  const place = volunteer.mahalluName.replace(/ mahallu$/i, '');

  return (
    <div className="dgrid">
      {/* Left Column */}
      <div>
        {/* Hero Panel */}
        <section className="hero-panel" aria-label="Welcome">
          <span className="tag live">
            <i />
            {place} Mahallu · Volunteer Duty
          </span>
          <h1 style={{ marginTop: 16 }}>
            {greeting()}, {firstName} {lastName && <span className="serif">{lastName}.</span>}
          </h1>
          <p className="sub">
            Thank you for helping with the Udhiyya programme in {place}. Every animal tracked, every household served.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 22, position: 'relative', zIndex: 1 }}>
            {volunteer.canStatus && (
              <Link className="pillbtn light" to="/app/volunteer/animals">
                Update animals
              </Link>
            )}
            {volunteer.canDistribute && (
              <Link
                className="pillbtn"
                style={{ background: 'rgba(255,255,255,.14)', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,.4)' }}
                to="/app/volunteer/distribute"
              >
                Distribute meat
              </Link>
            )}
            <Link
              className="pillbtn"
              style={{ background: 'rgba(255,255,255,.14)', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,.4)' }}
              to="/app/volunteer/activity"
            >
              My activity
            </Link>
          </div>

          <div style={{ marginTop: 26, position: 'relative', zIndex: 1 }}>
            <div className="lbl" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.16em', color: '#a9d4c2' }}>
              DISTRIBUTION OVERVIEW · MEAT PACKETS
            </div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 42, letterSpacing: '-.02em' }}>
              {meat.distributed} <span style={{ fontSize: 20, fontWeight: 500, color: '#cfe7db' }}>of {meat.issued}</span>
            </div>
          </div>
        </section>

        {/* 4 Stat Cards */}
        <div className="stat-grid" role="list" aria-label="Volunteer totals">
          <div className="stat" role="listitem">
            <div className="eyebrow">Total Animals</div>
            <div className="v">{animals.total}</div>
            <div className="s">{animals.slaughtered} slaughtered</div>
          </div>

          <div className="stat" role="listitem">
            <div className="eyebrow">Packets Assigned</div>
            <div className="v">{meat.issued}</div>
            <div className="s">{meat.inHand} in hand to deliver</div>
          </div>

          <div className="stat" role="listitem">
            <div className="eyebrow">Distributed</div>
            <div className="v">{meat.distributed}</div>
            <div className="s">confirmed handovers</div>
          </div>

          <div className="stat" role="listitem">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="eyebrow" style={{ margin: 0 }}>Mahallu Status</div>
              <KnowMore title="Volunteer Verification" ariaLabel="Know more about volunteer status">
                <p style={{ margin: 0 }}>
                  Authorized volunteer on duty for {place} Mahallu committee.
                </p>
              </KnowMore>
            </div>
            <div className="v" style={{ fontSize: 21, paddingTop: 5 }}>Active Volunteer</div>
            <div className="s">{place} Mahallu</div>
          </div>
        </div>

        {/* Tasks and Programme Progress */}
        <div style={{ marginTop: 22, display: 'grid', gap: 18 }}>
          <section className="card">
            <div className="am-cardhead" style={{ marginBottom: 14 }}>
              <span className="am-tile"><IconClipboard /></span>
              <div>
                <h2>Today’s tasks</h2>
                <span className="am-sub">Your pending actions in the programme.</span>
              </div>
            </div>
            <div className="am-tasks">
              {volunteer.canStatus && (
                <Task to="/app/volunteer/animals" icon={<IconEdit />} title="Update animal status" text="Mark animals as slaughtered, processing or packed." badge={`${notPacked} pending`} />
              )}
              {volunteer.canDistribute && (
                <Task to="/app/volunteer/distribute" icon={<IconTruck />} title="Distribute meat" text="Record meat packets given to households." badge={`${meat.inHand} remaining`} tone="amber" />
              )}
              <Task to="/app/volunteer/activity" icon={<IconClock />} title="My activity" text="View your recent updates and distributions." />
            </div>
          </section>

          <section className="card">
            <div className="am-headrow" style={{ alignItems: 'center' }}>
              <div className="am-cardhead" style={{ margin: 0 }}>
                <span className="am-tile"><IconPulse /></span>
                <div>
                  <h2>Programme progress</h2>
                  <span className="am-sub">{program ? `${program.name} · ${place}` : 'No programme is running'}</span>
                </div>
              </div>
              {program && <span className="am-pill">Running</span>}
            </div>
            {program ? (
              <>
                <ol className="am-vsteps" aria-label="Programme progress" style={{ marginTop: 16 }}>
                  {stages.map((stage, index) => (
                    <li key={stage.label} className={stage.done ? 'done' : ''}>
                      <span className="am-node">{stage.icon}</span>
                      <b>{stage.label}</b>
                      <small>{stage.value}</small>
                      {index < stages.length - 1 && <i aria-hidden="true" />}
                    </li>
                  ))}
                </ol>
                <div className="am-bar" style={{ marginTop: 18 }}>
                  <div className="progress" role="progressbar" aria-label="Programme progress" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
                    <i style={{ width: percent + '%' }} />
                  </div>
                  <b>{percent}% complete</b>
                </div>
              </>
            ) : (
              <p className="am-note" style={{ marginTop: 14 }}>Progress appears here once your committee starts the programme.</p>
            )}
          </section>
        </div>
      </div>

      {/* Right Sticky Rail */}
      <RightRail
        goalTitle="Distribution Goal"
        goalRaised={meat.distributed}
        goalTarget={meat.issued > 0 ? meat.issued : 100}
        goalLabel="DUTY GOAL"
        insightQuote="“The best of people are those that bring most benefit to the rest of mankind.”"
        insightLabel="SERVICE INSIGHT"
        activityLink="/app/volunteer/activity"
      />
    </div>
  );
}
