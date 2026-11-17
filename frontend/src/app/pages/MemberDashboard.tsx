import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/auth';
import { greeting } from '../lib/app-context';
import { animalLabel, dateText, inr, payModeLabel, type MyBooking, type MyProgram } from '../lib/programs';
import { downloadReceipt } from '../lib/receipt';
import { IconBell, IconDownload, IconPackage } from '../ui/Icons';
import { ErrorNote, Loading, useFetch } from '../ui/kit';
import { IconAnimal, IconCalendar, IconMegaphone, IconPlusCircle, IconPulse, IconReceipt, IconWallet } from '../ui/more-icons';
import { Photo, Stepper, statusWord, stepsWithDelivery, type Status } from '../ui/visuals';
import { KnowMore } from '../ui/KnowMore';
import { RightRail } from '../ui/RightRail';
import { PayModal } from './PaymentPanel';
import { SelectionModal } from './SelectionModal';

type Handover = { id: string; packets: number; receivedAt: string | null };
type Tracking = { programs: { id: string; handovers: Handover[] }[] };
type Inbox = { unread: number; items: { id: string; kind: string; title: string; body: string; link: string | null; createdAt: string; readAt: string | null }[] };

const ago = (value: string) => {
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 1440) return `${Math.round(minutes / 60)} h ago`;
  const days = Math.round(minutes / 1440);
  return days === 1 ? 'Yesterday' : `${days} days ago`;
};

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
  const track = useFetch<Tracking>('/me/tracking');
  const inbox = useFetch<Inbox>('/me/inbox');
  const [paying, setPaying] = useState<MyBooking | null>(null);
  const [editing, setEditing] = useState(false);
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
  const statusLabel = delivered ? 'Distributed' : focus ? (allAnimals.every(item => item.status === 'PACKED') ? 'Packed' : statusWord[focus.status]) : first.program.status === 'OPEN' ? 'Registration open' : 'Closed';
  const open = entries.some(item => item.program.status === 'OPEN');
  const owing = entries.filter(item => item.booking.money.remaining > 0);
  const payNow = () => owing.length === 1 ? setPaying(owing[0].booking) : navigate('/app/payments');
  const receipt = () => downloadReceipt({ member: user.name, household: `${first.program.household.ownerName} (${first.program.household.mahalluNumber})`, mahallu: first.program.mahalluName,
    programme: first.program.name, animal: entries.map(item => animalLabel[item.booking.animalType]).join(', '), shares, total, paid, remaining: total - paid,
    payments: entries.flatMap(item => item.booking.payments.filter(row => row.status === 'CONFIRMED')) });

  const nameParts = user.name.split(' ');
  const firstName = nameParts[0] || 'Muhammed';
  const lastName = nameParts.slice(1).join(' ') || 'Parad';

  return (
    <div className="dgrid">
      {/* Left Column */}
      <div>
        {/* Hero Panel */}
        <section className="hero-panel" aria-label="Welcome">
          <span className="tag live">
            <i />
            {first.program.mahalluName} · Verified Member
          </span>
          <h1 style={{ marginTop: 16 }}>
            {greeting()}, {firstName} <span className="serif">{lastName}.</span>
          </h1>
          <p className="sub">
            Your Udhiyya overview for {first.program.mahalluName} — every contribution verified, every distribution tracked.
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
              {inr(paid)}
            </div>
          </div>
        </section>

        {/* 4 Stat Cards in a clean row */}
        <div className="stat-grid" role="list" aria-label="Your totals">
          <div className="stat" role="listitem">
            <div className="eyebrow">My Animal</div>
            <div className="v">{entries.map(item => animalLabel[item.booking.animalType]).filter((name, index, all) => all.indexOf(name) === index).join(', ')}</div>
            <div className="s">{shares} {shares === 1 ? 'share' : 'shares'} booked</div>
          </div>

          <div className="stat" role="listitem">
            <div className="eyebrow">Payment Status</div>
            <div className="v">{inr(paid)}</div>
            <div className="s">of {inr(total)} · {percent}% paid</div>
          </div>

          <div className="stat" role="listitem">
            <div className="eyebrow">Animal Status</div>
            <div className="v" style={{ fontSize: 21, paddingTop: 4 }}>{statusLabel}</div>
            <div className="s">Last date: {dateText(first.program.payBy)}</div>
          </div>

          <div className="stat" role="listitem">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="eyebrow" style={{ margin: 0 }}>Mahallu Status</div>
              <KnowMore title="Mahallu Verification" ariaLabel="Know more about Mahallu status">
                <p style={{ margin: 0 }}>
                  Active membership verified with {first.program.mahalluName} committee. All records are audited and reconciled locally.
                </p>
              </KnowMore>
            </div>
            <div className="v" style={{ fontSize: 21, paddingTop: 5 }}>Verified Member</div>
            <div className="s">{first.program.mahalluName}</div>
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
        goalTarget={total > 0 ? total : 10000}
        goalLabel="UDHIYYA GOAL"
        insightQuote="“Their meat will not reach Allah, nor will their blood, but what reaches Him is piety from you.” (Surah Al-Hajj 22:37)"
        insightLabel="SUNNAH INSIGHT"
        activityLink="/app/payments"
      />

      {paying && <PayModal bookingId={paying.id} money={paying.money} close={() => setPaying(null)} done={reload} />}
      {editing && <SelectionModal programs={programs} reload={reload} close={() => setEditing(false)} />}
    </div>
  );
}
