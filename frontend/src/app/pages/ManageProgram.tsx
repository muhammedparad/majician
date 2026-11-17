import { useState, type KeyboardEvent, type ReactNode } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import { useApp } from '../lib/app-context';
import { animalLabel, dateText, inr, shareText, splitName, statusLabel, type Animal, type AnimalType, type Program, type PayMode } from '../lib/programs';
import { CustomSelect } from '../ui/CustomSelect';
import { IconCard, IconLayers, IconTag, IconUsers } from '../ui/Icons';
import { Allocation } from './ManageAllocation';
import { CashModal, PaymentsCard } from './ManagePayments';
import { ErrorNote, Loading, Modal, useAction, useFetch } from '../ui/kit';
import '../manage-program.css';

type Totals = { animalType: AnimalType; shares: number; animalsNeeded: number; amount: number }[];
type Booking = { id: string; householdId: string; animalType: AnimalType; shares: number; payMode: PayMode; amount: number;
  paid: number; remaining: number; standing: 'PAID' | 'ON_TRACK' | 'BEHIND';
  household: { mahalluNumber: string; ownerName: string; phone: string } };
type Bookings = { totals: Totals; rows: Booking[] };
type Households = { rows: { id: string; mahalluNumber: string; ownerName: string }[] };
type TabId = 'pricing' | 'bookings' | 'payments' | 'allocation';

function AnimalCard({ program, animal, reload }: { program: Program; animal: Animal; reload(): void }) {
  const { busy, error, run } = useAction();
  const { toast } = useApp();
  const [price, setPrice] = useState(String(animal.price || ''));
  const locked = program.status === 'ENDED';
  const save = (body: object, message: string) => run(async () => { await api(`/programs/${program.id}/animals/${animal.animalType}`, 'PATCH', body, true); toast(message); reload(); });
  const changed = Number(price || 0) !== animal.price;
  return <article className={'am-animal' + (animal.enabled ? '' : ' off')}>
    <div className="am-headrow"><div className="am-animal-head"><div><h3>{animalLabel[animal.animalType]}</h3><div className="am-sub">{shareText(animal.sharesPerAnimal)}</div></div></div>
      <label className="switch" title={animal.enabled ? 'Offered to members' : 'Hidden from members'}>
        <input type="checkbox" checked={animal.enabled} disabled={busy || locked} aria-label={`Offer ${animalLabel[animal.animalType]}`}
          onChange={event => save({ enabled: event.target.checked }, event.target.checked ? 'Animal offered' : 'Animal hidden')} /><span className="tr" /></label></div>
    <div className="field" style={{ margin: 0 }}><label htmlFor={'p-' + animal.animalType}>Price per animal (₹)</label>
      <div className="am-inline"><input id={'p-' + animal.animalType} className="inp" type="number" min={0} inputMode="numeric" value={price}
        disabled={locked} onChange={event => setPrice(event.target.value)} placeholder="0" />
      <button type="button" className="pillbtn sm" disabled={busy || locked || !changed} onClick={() => save({ price: Number(price || 0) }, 'Price saved')}>Save</button></div></div>
    <div className="kv"><span>{animal.sharesPerAnimal === 1 ? 'Price per person' : 'Price per share'}</span><b>{animal.price ? inr(animal.sharePrice) : '—'}</b></div>
    {error && <p className="am-error" role="alert">{error}</p>}
  </article>;
}

function AddBooking({ program, close, done }: { program: Program; close(): void; done(): void }) {
  const { busy, error, run } = useAction();
  const homes = useFetch<Households>(`/mahallus/${program.mahalluId}/households`);
  const [home, setHome] = useState('');
  const [type, setType] = useState<AnimalType>(program.animals.find(item => item.enabled)?.animalType ?? 'GOAT');
  const [shares, setShares] = useState(1);
  const [mode, setMode] = useState<PayMode>('INSTALLMENTS');
  const { toast } = useApp();
  return <Modal title={<>Add <span className="serif">booking</span></>} onClose={close}>
    {homes.loading ? <Loading /> : <>
      <div className="field"><label>Household</label><CustomSelect variant="input" block value={home} placeholder="Choose a household" ariaLabel="Household"
        options={(homes.data?.rows ?? []).map(row => ({ value: row.id, label: `${row.mahalluNumber} · ${row.ownerName}` }))} onChange={setHome} /></div>
      <div className="field"><label>Animal</label><CustomSelect variant="input" block value={type} ariaLabel="Animal" onChange={value => setType(value as AnimalType)}
        options={program.animals.filter(item => item.enabled).map(item => ({ value: item.animalType, label: `${animalLabel[item.animalType]} · ${inr(item.sharePrice)} per ${item.sharesPerAnimal === 1 ? 'animal' : 'share'}` }))} /></div>
      <div className="field"><label htmlFor="shares">Shares</label><input id="shares" className="inp" type="number" min={1} max={100} value={shares} onChange={event => setShares(Number(event.target.value))} /></div>
      <div className="seg" style={{ marginBottom: 16 }}>{(['INSTALLMENTS', 'ONE_TIME'] as const).map(value => <button key={value} type="button" className={mode === value ? 'on' : ''}
        onClick={() => setMode(value)}>{value === 'ONE_TIME' ? 'One-time' : 'Installments'}</button>)}</div>
      {error && <p className="am-error" role="alert">{error}</p>}
      <button className="pillbtn" type="button" disabled={busy || !home} onClick={() => run(async () => {
        await api(`/programs/${program.id}/bookings`, 'POST', { householdId: home, animalType: type, shares, payMode: mode }, true);
        toast('Booking added'); done(); close();
      })}>{busy ? 'Saving…' : 'Add booking'}</button></>}
  </Modal>;
}

export function ManageProgram() {
  const { id = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useApp();
  const program = useFetch<Program>('/programs/' + id);
  const bookings = useFetch<Bookings>(`/programs/${id}/bookings`);
  const { busy, error, run } = useAction();
  const [adding, setAdding] = useState(false);
  const [cash, setCash] = useState<Booking | null>(null);
  const [version, setVersion] = useState(0);
  const reload = () => { program.reload(); bookings.reload(); setVersion(count => count + 1); };
  const p = program.data;
  if (program.loading && !p) return <Loading />;
  if (!p) return <ErrorNote message={program.error} />;

  const act = (path: string, message: string, confirm: string) => {
    if (!window.confirm(confirm)) return;
    void run(async () => { await api(`/programs/${id}/${path}`, 'POST', {}, true); toast(message); reload(); });
  };

  const enabledCount = p.animals.filter(item => item.enabled).length;
  const bookingCount = bookings.data?.rows.length ?? 0;
  const totalBookedAmount = bookings.data?.totals.reduce((sum, row) => sum + row.amount, 0) ?? 0;

  const tabs: { id: TabId; label: string; shortLabel: string; icon: ReactNode; badge?: string }[] = [
    { id: 'pricing', label: 'Animals & Pricing', shortLabel: 'Pricing', icon: <IconTag />, badge: `${enabledCount}/${p.animals.length}` },
    { id: 'bookings', label: 'Bookings', shortLabel: 'Bookings', icon: <IconUsers />, badge: bookings.data ? String(bookingCount) : undefined },
    ...(p.status !== 'DRAFT' ? [
      { id: 'payments' as const, label: 'Payments', shortLabel: 'Payments', icon: <IconCard /> },
      { id: 'allocation' as const, label: 'Allocation & Draw', shortLabel: 'Allocation', icon: <IconLayers /> },
    ] : []),
  ];

  const requestedTab = searchParams.get('tab') as TabId | null;
  const defaultTab: TabId = p.status === 'DRAFT' ? 'pricing' : 'bookings';
  const activeTab: TabId = tabs.some(tab => tab.id === requestedTab) ? requestedTab! : defaultTab;

  const selectTab = (next: TabId) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', next);
    setSearchParams(params, { replace: true });
  };

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const nextTab = tabs[(index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
    selectTab(nextTab.id);
    document.getElementById(`mp-tab-${nextTab.id}`)?.focus();
  };

  const [titleHead, titleTail] = splitName(p.name);

  return <div className="mp-wrap">
    {/* Programme Summary Header */}
    <section className="card mp-header" aria-label="Program overview">
      <div className="mp-header-top">
        <div>
          <Link to="/app/manage/programs" className="mp-back">← All programs</Link>
          <div className="eyebrow"><span className="dot" />{statusLabel[p.status]} program</div>
          <div className="mp-title-row">
            <h1>{titleHead}<span className="serif">{titleTail}</span></h1>
            <span className={'tag' + (p.status === 'OPEN' ? ' live' : p.status === 'DRAFT' ? ' amber' : ' off')}>
              {p.status === 'OPEN' && <i />}
              {statusLabel[p.status]}
            </span>
          </div>
          <p className="mp-sub">
            Udhiyya on {dateText(p.targetDate)} · payments due by {dateText(p.payBy)}.{p.description ? ' ' + p.description : ''}
          </p>
        </div>

        <div className="row-actions">
          {p.status === 'DRAFT' && (
            <button type="button" className="pillbtn" disabled={busy} onClick={() => act('start', 'Program started', 'Start this program? Households will be able to book.')}>
              Start program
            </button>
          )}
          {p.status === 'OPEN' && <>
            <button type="button" className="pillbtn" onClick={() => setAdding(true)}>Add booking</button>
            <button type="button" className="pillbtn danger" disabled={busy} onClick={() => act('end', 'Program ended', 'End this program? Bookings and prices can no longer be changed.')}>
              End program
            </button>
          </>}
        </div>
      </div>

      <div className="mp-meta-strip">
        <span className="mp-meta-item">Animals offered: <b>{enabledCount} of {p.animals.length}</b></span>
        {bookings.data && <>
          <span className="mp-meta-item">Bookings: <b>{bookingCount}</b></span>
          <span className="mp-meta-item">Total booked: <b>{inr(totalBookedAmount)}</b></span>
        </>}
        {p.status !== 'DRAFT' && (
          <Link to={`/transparency/${p.id}`} style={{ marginLeft: 'auto', fontWeight: 600 }}>
            View public ledger →
          </Link>
        )}
      </div>
    </section>

    {error && <ErrorNote message={error} />}

    {/* Section Navigation Bar */}
    <div className="mp-tabs-bar">
      <div className="mp-tabs" role="tablist" aria-label="Program sections">
        {tabs.map((tab, index) => {
          const isSelected = activeTab === tab.id;
          return <button
            key={tab.id}
            id={`mp-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={isSelected}
            aria-controls={`mp-panel-${tab.id}`}
            tabIndex={isSelected ? 0 : -1}
            className={`mp-tab${isSelected ? ' on' : ''}`}
            onClick={() => selectTab(tab.id)}
            onKeyDown={event => onTabKeyDown(event, index)}
          >
            {tab.icon}
            <span className="mp-tab-full">{tab.label}</span>
            <span className="mp-tab-short">{tab.shortLabel}</span>
            {tab.badge !== undefined && <span className="mp-tab-badge">{tab.badge}</span>}
          </button>;
        })}
      </div>
    </div>

    {/* Active Section Panel (only the selected section renders) */}
    <div
      key={activeTab}
      id={`mp-panel-${activeTab}`}
      role="tabpanel"
      aria-labelledby={`mp-tab-${activeTab}`}
      className="mp-panel"
    >
      {activeTab === 'pricing' && (
        <section className="card">
          <div className="mp-section-head">
            <div>
              <div className="eyebrow"><span className="dot" />CONFIGURATION</div>
              <h2>Animals &amp; <span className="serif">pricing</span></h2>
              <p>Toggle which animals are offered to households and set the price per animal.</p>
            </div>
            {p.status === 'ENDED' && <span className="tag off">Locked · Program ended</span>}
          </div>

          {p.status === 'DRAFT' && (
            <div className="mp-draft-banner" style={{ marginBottom: 18 }}>
              <span>Review your animals and prices below, then start the program when you are ready to accept household bookings.</span>
              <button type="button" className="pillbtn sm" disabled={busy} onClick={() => act('start', 'Program started', 'Start this program? Households will be able to book.')}>
                Start program
              </button>
            </div>
          )}

          <div className="mp-pricing-grid">
            {p.animals.map(animal => <AnimalCard key={animal.animalType} program={p} animal={animal} reload={reload} />)}
          </div>
        </section>
      )}

      {activeTab === 'bookings' && (
        <section className="card">
          <div className="mp-section-head">
            <div>
              <div className="eyebrow"><span className="dot" />ANIMALS NEEDED</div>
              <h2>Bookings so <span className="serif">far</span></h2>
            </div>
            {p.status === 'OPEN' && (
              <button type="button" className="pillbtn ghost sm" onClick={() => setAdding(true)}>Add booking</button>
            )}
          </div>

          {bookings.loading && !bookings.data ? <Loading /> : !bookings.data ? <ErrorNote message={bookings.error} /> : <>
            {bookings.data.totals.length > 0 && <div className="stat-grid" role="list" style={{ marginTop: 0 }}>
              {bookings.data.totals.map(row => <div className="stat" role="listitem" key={row.animalType}>
                <div className="eyebrow">{animalLabel[row.animalType]}</div>
                <div className="v">{row.animalsNeeded}</div>
                <div className="s">{row.animalsNeeded === 1 ? 'animal' : 'animals'} for {row.shares} {row.shares === 1 ? 'share' : 'shares'} · {inr(row.amount)}</div>
              </div>)}
            </div>}

            {bookings.data.rows.length === 0 ? (
              <div className="empty">
                <h3>No bookings yet</h3>
                <p>{p.status === 'DRAFT' ? 'Start the program to let households book.' : 'Bookings will appear here as households join.'}</p>
              </div>
            ) : (
              <div className="tx-wrap" style={{ marginTop: 18 }}>
                <table className="tx">
                  <thead>
                    <tr>
                      <th>House</th>
                      <th>Owner</th>
                      <th>Animal</th>
                      <th>Shares</th>
                      <th>Plan</th>
                      <th>Total</th>
                      <th>Paid</th>
                      <th>Status</th>
                      {p.status === 'OPEN' && <th />}
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.data.rows.map(row => (
                      <tr key={row.id}>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{row.household.mahalluNumber}</td>
                        <td><b>{row.household.ownerName}</b></td>
                        <td>{animalLabel[row.animalType]}</td>
                        <td>{row.shares}</td>
                        <td>{row.payMode === 'ONE_TIME' ? 'One-time' : 'Installments'}</td>
                        <td className="amt">{inr(row.amount)}</td>
                        <td className="amt">{inr(row.paid)}</td>
                        <td>
                          <span className={'tag' + (row.standing === 'BEHIND' ? ' amber' : '')}>
                            {row.standing === 'PAID' ? 'Paid' : row.standing === 'BEHIND' ? 'Due' : 'On track'}
                          </span>
                        </td>
                        {p.status === 'OPEN' && (
                          <td>
                            <div className="row-actions">
                              {row.remaining > 0 && <button type="button" className="chipbtn" onClick={() => setCash(row)}>Cash</button>}
                              <button type="button" className="chipbtn" onClick={() => {
                                if (!window.confirm(`Cancel ${row.household.ownerName}'s booking?`)) return;
                                void run(async () => { await api('/bookings/' + row.id, 'DELETE', {}, true); toast('Booking cancelled'); reload(); });
                              }}>Cancel</button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>}
        </section>
      )}

      {activeTab === 'payments' && p.status !== 'DRAFT' && (
        <PaymentsCard programId={id} open={p.status === 'OPEN'} refreshKey={version} onChange={reload} />
      )}

      {activeTab === 'allocation' && p.status !== 'DRAFT' && (
        <Allocation programId={id} open={p.status === 'OPEN'} onChange={reload} />
      )}
    </div>

    {cash && <CashModal bookingId={cash.id} owner={cash.household.ownerName} remaining={cash.remaining} close={() => setCash(null)} done={reload} />}
    {adding && <AddBooking program={p} close={() => setAdding(false)} done={reload} />}
  </div>;
}
