import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/auth';
import { AnimatedNumber, useAppReveal } from '../../features/motion/primitives';
import { greeting, shortMahallu, useWide } from '../lib/app-context';
import { animalLabel, dateText, inr, payModeLabel, type MyBooking, type MyProgram } from '../lib/programs';
import { downloadReceipt } from '../lib/receipt';
import { IconCard, IconChart, IconDoc, IconDownload, IconHand, IconHeart, IconShield } from '../ui/Icons';
import { useFetch } from '../ui/kit';
import { Photo, Stepper, statusWord, stepsWithDelivery, type Status } from '../ui/visuals';
import { KnowMore } from '../ui/KnowMore';
import { RightRail, type ActivityItem } from '../ui/RightRail';
import { PayModal } from './PaymentPanel';
import { SelectionModal } from './SelectionModal';

type Handover = { id: string; packets: number; createdAt?: string; receivedAt: string | null };
type Tracking = { programs: { id: string; handovers: Handover[] }[] };

function bannerFor(status: Status, hasCode: boolean, delivered: boolean) {
  if (delivered) return 'Your household has received its meat. Thank you for your Udhiyya.';
  if (!hasCode) return 'Your animal will be assigned once registration closes. We will tell you as soon as it is.';
  if (status === 'PENDING') return 'Your animal is in the queue. We will notify you before the slaughter.';
  if (status === 'SLAUGHTERED') return 'Your animal has been slaughtered. Processing starts soon.';
  if (status === 'PROCESSING') return 'Your meat is being cut and weighed. We will notify you when it is packed.';
  return 'Your meat is packed and ready. We will tell you when it is handed to your household.';
}

export function MemberDashboard({ programs, reload }: { programs: MyProgram[]; reload(): void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const wide = useWide();
  const revealRoot = useRef<HTMLDivElement>(null);
  const track = useFetch<Tracking>('/me/tracking');
  const [paying, setPaying] = useState<MyBooking | null>(null);
  const [editing, setEditing] = useState(false);
  useAppReveal(revealRoot, wide);
  const entries = programs.flatMap(program => program.bookings.map(booking => ({ program, booking })));
  const first = entries[0];
  if (!user || !first) return null;

  const handovers = (track.data?.programs ?? []).flatMap(item => item.handovers);
  const delivered = handovers.length > 0;
  const total = entries.reduce((sum, item) => sum + item.booking.money.total, 0);
  const paid = entries.reduce((sum, item) => sum + item.booking.money.paid, 0);
  const shares = entries.reduce((sum, item) => sum + item.booking.shares, 0);
  const percent = total ? Math.min(100, Math.round(paid / total * 100)) : 0;
  const allAnimals = entries.flatMap(item => item.booking.animals);
  const focus = allAnimals.filter(item => item.status !== 'PACKED').sort((a, b) => (a.drawOrder ?? 1e9) - (b.drawOrder ?? 1e9))[0] ?? allAnimals[0];
  const statusLabel = delivered ? 'Distributed' : focus ? (allAnimals.every(item => item.status === 'PACKED') ? 'Packed' : statusWord[focus.status]) : first.program.status === 'OPEN' ? 'Open' : 'Closed';
  const open = entries.some(item => item.program.status === 'OPEN');
  const owing = entries.filter(item => item.booking.money.remaining > 0);
  const payNow = () => owing.length === 1 ? setPaying(owing[0].booking) : navigate('/app/payments');
  const receipt = () => downloadReceipt({ member: user.name, household: `${first.program.household.ownerName} (${first.program.household.mahalluNumber})`, mahallu: first.program.mahalluName,
    programme: first.program.name, animal: entries.map(item => animalLabel[item.booking.animalType]).join(', '), shares, total, paid, remaining: total - paid,
    payments: entries.flatMap(item => item.booking.payments.filter(row => row.status === 'CONFIRMED')) });

  const nameParts = user.name.trim().split(/\s+/);
  const firstName = nameParts[0] || 'Member';
  const lastName = nameParts.slice(1).join(' ');
  const place = shortMahallu(first.program.mahalluName);
  const animalNames = entries.map(item => animalLabel[item.booking.animalType]).filter((name, index, all) => all.indexOf(name) === index).join(', ');

  const recentActivities: ActivityItem[] = [
    ...entries.flatMap(({ booking }) =>
      booking.payments.map(payment => ({
        at: +new Date(payment.createdAt),
        item: {
          icon: 'heart' as const,
          title: `${payment.method === 'CASH' ? 'Cash' : 'Online'} payment`,
          detail: `${animalLabel[booking.animalType]} · ${dateText(payment.createdAt)}`,
          amount: payment.status === 'CONFIRMED' ? `+${inr(payment.amount)}` : payment.status === 'PENDING' ? 'Pending' : 'Not completed',
          isPlus: payment.status === 'CONFIRMED',
        },
      })),
    ),
    ...handovers.map(row => ({
      at: +(row.receivedAt ? new Date(row.receivedAt) : row.createdAt ? new Date(row.createdAt) : new Date(0)),
      item: {
        icon: 'hand' as const,
        title: row.receivedAt ? 'Meat handover confirmed' : 'Meat packets handed over',
        detail: `${row.packets} ${row.packets === 1 ? 'packet' : 'packets'}`,
        amount: row.receivedAt ? 'Received' : `${row.packets} pkts`,
        isPlus: true,
      },
    })),
  ]
    .sort((a, b) => b.at - a.at)
    .slice(0, 5)
    .map(entry => entry.item);

  if (!wide) {
    return (
      <div ref={revealRoot}>
        <section className="mbalance" aria-label="Udhiyya overview">
          <div className="lbl">UDHIYYA OVERVIEW · TOTAL CONTRIBUTED</div>
          <div className="bal"><AnimatedNumber value={paid} format={inr} /></div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', position: 'relative', zIndex: 1 }}>
            <span className="tag" style={{ background: 'rgba(255,255,255,.16)', color: '#fff' }}>
              Verified member
            </span>
            <span style={{ fontSize: 12.5, color: '#bfe0d1' }}>{place}</span>
          </div>
        </section>

        <div className="mchips" role="group" aria-label="Quick actions">
          <button type="button" className="primary" disabled={owing.length === 0 || !open} onClick={payNow}>
            <IconCard />
            <span>{owing.length === 0 ? 'Fully paid' : 'Make payment'}</span>
          </button>
          <Link to="/app/tracking">
            <IconDoc />
            <span>Track animal</span>
          </Link>
          <button type="button" onClick={receipt}>
            <IconDownload />
            <span>Receipt</span>
          </button>
          <Link to="/app/payments">
            <IconChart />
            <span>Payments</span>
          </Link>
        </div>

        <div className="t2col">
          <section className="mcard" style={{ marginTop: 14 }}>
            <div className="eyebrow">My Animal</div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 23, color: 'var(--ink2)', marginTop: 6 }}>
              {animalNames}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
              {shares} {shares === 1 ? 'share' : 'shares'} booked
            </div>
          </section>

          <section className="mcard" style={{ marginTop: 14 }}>
            <div className="eyebrow">Animal Status</div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 23, color: 'var(--ink2)', marginTop: 6 }}>
              {statusLabel}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
              Last date: {dateText(first.program.payBy)}
            </div>
          </section>
        </div>

        <section className="msec" data-app-reveal="">
          <div className="msec-head">
            <h2>Payment <span className="serif">goal</span></h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="tag"><AnimatedNumber value={percent} />%</span>
              <KnowMore title={first.program.name} ariaLabel="Know more about payment goal">
                <p style={{ margin: 0 }}>
                  Your Udhiyya share payment progress for {first.program.name} in {place}.
                </p>
              </KnowMore>
            </div>
          </div>
          <div className="mcard">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <b style={{ color: 'var(--ink2)' }}>{first.program.name}</b>
              <span style={{ color: 'var(--muted)' }}>{inr(paid)} of {inr(total)}</span>
            </div>
            <div className="progress" style={{ marginTop: 12 }}>
              <i style={{ width: `${percent}%` }}></i>
            </div>
          </div>
        </section>

        <section className="msec" data-app-reveal="">
          <div className="msec-head">
            <h2>My <span className="serif">animal</span></h2>
            {open && (
              <button type="button" onClick={() => setEditing(true)}>Edit selection</button>
            )}
          </div>
          {entries.map(({ program, booking }) => {
            const placed = booking.animals.length ? booking.animals : [null];
            return placed.map((animal, index) => {
              const status: Status = animal?.status ?? 'PENDING';
              const at = delivered && status === 'PACKED' ? 4 : ['PENDING', 'SLAUGHTERED', 'PROCESSING', 'PACKED'].indexOf(status);
              return (
                <article key={booking.id + index} className="mcard am-myanimal" style={{ marginBottom: 12 }}>
                  <Photo type={booking.animalType} />
                  <div className="am-myanimal-body">
                    <div className="am-headrow" style={{ alignItems: 'center' }}>
                      <div>
                        <h2>My animal{animal ? ` — ${animal.code}` : ''}</h2>
                        <span className="am-sub">
                          {animalLabel[booking.animalType]} · {animal ? animal.shares : booking.shares} {(animal ? animal.shares : booking.shares) === 1 ? 'share' : 'shares'} · {payModeLabel[booking.payMode]}
                        </span>
                      </div>
                      <span className="tag">{program.status === 'OPEN' ? 'Open' : 'Ended'}</span>
                    </div>
                    <Stepper list={stepsWithDelivery} at={at} label={`Animal progress: ${animal ? statusWord[status] : 'Waiting'}`} />
                  </div>
                  <div className="am-banner"><span aria-hidden="true">i</span>{bannerFor(status, Boolean(animal), delivered && at === 4)}</div>
                </article>
              );
            });
          })}
        </section>

        <section className="msec" data-app-reveal="">
          <div className="mcard" style={{ background: 'var(--bg2)', border: '1.5px solid var(--mint-soft)', boxShadow: 'none' }}>
            <div className="eyebrow">
              <span className="dot"></span>SUNNAH INSIGHT
            </div>
            <p style={{ fontSize: 15.5, color: 'var(--ink2)', marginTop: 8 }}>
              “Their meat will not reach Allah, nor will their blood, but what reaches Him is piety from you.” (Surah Al-Hajj 22:37)
            </p>
          </div>
        </section>

        <section className="msec" data-app-reveal="">
          <div className="msec-head">
            <h2>Recent <span className="serif">activity</span></h2>
            <Link to="/app/payments">See all</Link>
          </div>
          <div className="mcard" style={{ padding: '8px 18px' }}>
            {recentActivities.length === 0 ? (
              <p style={{ fontSize: 13.5, color: 'var(--muted)', padding: '12px 0', margin: 0 }}>
                No payments or handovers recorded yet.
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

        {paying && <PayModal bookingId={paying.id} money={paying.money} close={() => setPaying(null)} done={reload} />}
        {editing && <SelectionModal programs={programs} reload={reload} close={() => setEditing(false)} />}
      </div>
    );
  }

  return (
    <div className="dgrid" ref={revealRoot}>
      {/* Left Column */}
      <div>
        {/* Hero Panel */}
        <section className="hero-panel" aria-label="Welcome">
          <span className="tag live">
            <i />
            {place} · Verified Member
          </span>
          <h1 style={{ marginTop: 16 }}>
            {greeting()}, {firstName}
            {lastName ? <> <span className="serif">{lastName}.</span></> : '.'}
          </h1>
          <p className="sub">
            Your Udhiyya overview for {place} — every contribution verified, every distribution tracked.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 22, position: 'relative', zIndex: 1 }}>
            <button
              type="button"
              className="pillbtn light"
              disabled={owing.length === 0 || !open}
              onClick={payNow}
            >
              {owing.length === 0 ? 'Fully paid' : 'Make payment'}
            </button>
            <Link
              className="pillbtn"
              style={{ background: 'rgba(255,255,255,.14)', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,.4)' }}
              to="/app/tracking"
            >
              Track animal
            </Link>
            <button
              type="button"
              className="pillbtn"
              style={{ background: 'rgba(255,255,255,.14)', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,.4)' }}
              onClick={receipt}
            >
              Download receipt
            </button>
          </div>

          <div style={{ marginTop: 26, position: 'relative', zIndex: 1 }}>
            <div className="lbl" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.16em', color: '#a9d4c2' }}>
              UDHIYYA OVERVIEW · TOTAL CONTRIBUTED
            </div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 42, letterSpacing: '-.02em' }}>
              <AnimatedNumber value={paid} format={inr} />
            </div>
          </div>
        </section>

        {/* 4 Stat Cards in a clean row */}
        <div className="stat-grid" role="list" aria-label="Your totals">
          <div className="stat" role="listitem">
            <div className="eyebrow">My Animal</div>
            <div className="v">{animalNames}</div>
            <div className="s">{shares} {shares === 1 ? 'share' : 'shares'} booked</div>
          </div>

          <div className="stat" role="listitem">
            <div className="eyebrow">Payment Status</div>
            <div className="v"><AnimatedNumber value={paid} format={inr} /></div>
            <div className="s">of {inr(total)} · <AnimatedNumber value={percent} />% paid</div>
          </div>

          <div className="stat" role="listitem">
            <div className="eyebrow">Animal Status</div>
            <div className="v" style={{ fontSize: 21, paddingTop: 5 }}>{statusLabel}</div>
            <div className="s">Last date: {dateText(first.program.payBy)}</div>
          </div>

          <div className="stat" role="listitem">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="eyebrow" style={{ margin: 0 }}>Mahallu Status</div>
              <KnowMore title="Mahallu Verification" ariaLabel="Know more about Mahallu status">
                <p style={{ margin: 0 }}>
                  Active membership verified with {place} committee. All records are audited and reconciled locally.
                </p>
              </KnowMore>
            </div>
            <div className="v" style={{ fontSize: 21, paddingTop: 5 }}>Verified Member</div>
            <div className="s">{place}</div>
          </div>
        </div>

        {/* Animal Details & Stepper */}
        <div style={{ marginTop: 22 }}>
          {entries.map(({ program, booking }) => {
            const placed = booking.animals.length ? booking.animals : [null];
            return placed.map((animal, index) => {
              const status: Status = animal?.status ?? 'PENDING';
              const at = delivered && status === 'PACKED' ? 4 : ['PENDING', 'SLAUGHTERED', 'PROCESSING', 'PACKED'].indexOf(status);
              return (
                <article key={booking.id + index} className="card am-myanimal am-reveal" style={{ marginBottom: 18 }}>
                  <Photo type={booking.animalType} />
                  <div className="am-myanimal-body">
                    <div className="am-headrow" style={{ alignItems: 'center' }}>
                      <div>
                        <h2>My animal{animal ? ` — ${animal.code}` : ''}</h2>
                        <span className="am-sub">
                          {animalLabel[booking.animalType]} · {animal ? animal.shares : booking.shares} {(animal ? animal.shares : booking.shares) === 1 ? 'share' : 'shares'} · {payModeLabel[booking.payMode]}
                        </span>
                      </div>
                      <span className="tag">{program.status === 'OPEN' ? 'Open' : 'Ended'}</span>
                    </div>
                    <Stepper list={stepsWithDelivery} at={at} label={`Animal progress: ${animal ? statusWord[status] : 'Waiting'}`} />
                  </div>
                  <div className="am-banner"><span aria-hidden="true">i</span>{bannerFor(status, Boolean(animal), delivered && at === 4)}</div>
                </article>
              );
            });
          })}
          {open && (
            <button type="button" className="pillbtn ghost sm" onClick={() => setEditing(true)}>
              Edit my selection
            </button>
          )}
        </div>
      </div>

      {/* Right Sticky Rail */}
      <RightRail
        goalTitle={`${first.program.name} Goal`}
        goalRaised={paid}
        goalTarget={total}
        goalLabel="UDHIYYA GOAL"
        insightQuote="“Their meat will not reach Allah, nor will their blood, but what reaches Him is piety from you.” (Surah Al-Hajj 22:37)"
        insightLabel="SUNNAH INSIGHT"
        activityLink="/app/payments"
        activities={recentActivities}
      />

      {paying && <PayModal bookingId={paying.id} money={paying.money} close={() => setPaying(null)} done={reload} />}
      {editing && <SelectionModal programs={programs} reload={reload} close={() => setEditing(false)} />}
    </div>
  );
}
