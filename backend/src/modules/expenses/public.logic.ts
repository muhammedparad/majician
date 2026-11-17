export type PublicStage = 'OPEN' | 'SCHEDULED' | 'SLAUGHTERING' | 'PROCESSING' | 'COMPLETED' | 'DISTRIBUTING' | 'ENDED';

export type PublicUpdate = {
  id: string;
  stage: 'program' | 'slaughter' | 'processing' | 'completed' | 'distribution';
  title: string;
  detail: string;
  at: Date | null;
  state: 'done' | 'live';
};

export type PublicAnimalRow = {
  animalType: string;
  status: string;
  slaughteredAt: Date | null;
  processingAt: Date | null;
  packedAt: Date | null;
};

const earliest = (dates: (Date | null | undefined)[]) =>
  dates.reduce<Date | null>((best, d) => (d && (!best || d < best) ? d : best), null);
const latest = (dates: (Date | null | undefined)[]) =>
  dates.reduce<Date | null>((best, d) => (d && (!best || d > best) ? d : best), null);

/** Pure aggregate builder for public operations & overall milestone updates (never person-based). */
export function summarizePublicOperations(input: {
  programStatus: string;
  openedAt: Date | null;
  allocatedAt: Date | null;
  createdAt: Date;
  animals: PublicAnimalRow[];
  packetsIssued: number;
  packetsHandedOut: number;
  householdsServed: number;
  firstIssueAt: Date | null;
  firstHandoverAt: Date | null;
  lastHandoverAt: Date | null;
}) {
  const { animals, packetsIssued, packetsHandedOut, householdsServed } = input;
  const total = animals.length;
  const count = (status: string) => animals.filter(a => a.status === status).length;
  const pending = count('PENDING');
  const inSlaughter = count('SLAUGHTERED');
  const inProcessing = count('PROCESSING');
  const packed = count('PACKED');

  const cumSlaughtered = inSlaughter + inProcessing + packed;
  const cumProcessing = inProcessing + packed;
  const cumCompleted = packed;

  const slaughterStartedAt = earliest(animals.map(a => a.slaughteredAt));
  const slaughterCompletedAt = total > 0 && cumSlaughtered === total ? latest(animals.map(a => a.slaughteredAt)) : null;
  const processingStartedAt = earliest(animals.map(a => a.processingAt));
  const processingCompletedAt = total > 0 && cumProcessing === total ? latest(animals.map(a => a.processingAt)) : null;
  const packingStartedAt = earliest(animals.map(a => a.packedAt));
  const packingCompletedAt = total > 0 && cumCompleted === total ? latest(animals.map(a => a.packedAt)) : null;

  const distributionStarted = packetsHandedOut > 0 || packetsIssued > 0;
  const distributionStartedAt = earliest([input.firstHandoverAt, input.firstIssueAt]);

  const byTypeMap = new Map<string, { animalType: string; total: number; pending: number; slaughtered: number; processing: number; packed: number }>();
  for (const row of animals) {
    const bucket = byTypeMap.get(row.animalType) ?? { animalType: row.animalType, total: 0, pending: 0, slaughtered: 0, processing: 0, packed: 0 };
    bucket.total += 1;
    if (row.status === 'PENDING') bucket.pending += 1;
    else if (row.status === 'SLAUGHTERED') bucket.slaughtered += 1;
    else if (row.status === 'PROCESSING') bucket.processing += 1;
    else if (row.status === 'PACKED') bucket.packed += 1;
    byTypeMap.set(row.animalType, bucket);
  }

  const liveStage: PublicStage =
    input.programStatus === 'ENDED' ? 'ENDED' :
    distributionStarted ? 'DISTRIBUTING' :
    total > 0 && cumCompleted === total ? 'COMPLETED' :
    cumProcessing > 0 ? 'PROCESSING' :
    cumSlaughtered > 0 ? 'SLAUGHTERING' :
    total > 0 ? 'SCHEDULED' : 'OPEN';

  const updates: PublicUpdate[] = [];
  if (distributionStarted) {
    updates.push({
      id: 'distribution-started',
      stage: 'distribution',
      title: 'Meat distribution started',
      detail: packetsHandedOut > 0
        ? `${packetsHandedOut} ${packetsHandedOut === 1 ? 'packet' : 'packets'} handed out to ${householdsServed} ${householdsServed === 1 ? 'household' : 'households'}.`
        : `${packetsIssued} ${packetsIssued === 1 ? 'packet' : 'packets'} issued to field volunteers for distribution.`,
      at: input.lastHandoverAt ?? distributionStartedAt,
      state: input.programStatus === 'ENDED' ? 'done' : 'live',
    });
  }
  if (cumCompleted > 0) {
    const allDone = total > 0 && cumCompleted === total;
    updates.push({
      id: 'packing-status',
      stage: 'completed',
      title: allDone ? 'All animals completed & packed' : 'Packing & completion underway',
      detail: allDone
        ? `All ${total} ${total === 1 ? 'animal is' : 'animals are'} cut, weighed, and packed for distribution.`
        : `${cumCompleted} of ${total} animals completed and packed.`,
      at: allDone ? packingCompletedAt : latest(animals.map(a => a.packedAt)) ?? packingStartedAt,
      state: allDone ? 'done' : 'live',
    });
  }
  if (cumProcessing > 0) {
    const allProcessed = total > 0 && cumProcessing === total;
    updates.push({
      id: 'processing-status',
      stage: 'processing',
      title: allProcessed ? 'Meat processing completed' : 'Meat processing in progress',
      detail: allProcessed
        ? `All ${total} animals have moved through cutting and weighing.`
        : `${cumProcessing} of ${total} animals reached processing (${inProcessing} currently being cut & weighed).`,
      at: allProcessed ? processingCompletedAt : latest(animals.map(a => a.processingAt)) ?? processingStartedAt,
      state: allProcessed ? 'done' : 'live',
    });
  }
  if (cumSlaughtered > 0) {
    const allSlaughtered = total > 0 && cumSlaughtered === total;
    updates.push({
      id: 'slaughter-status',
      stage: 'slaughter',
      title: allSlaughtered ? 'All animals slaughtered' : 'Slaughter started',
      detail: allSlaughtered
        ? `All ${total} scheduled animals have been slaughtered.`
        : `${cumSlaughtered} of ${total} animals slaughtered so far.`,
      at: allSlaughtered ? slaughterCompletedAt : latest(animals.map(a => a.slaughteredAt)) ?? slaughterStartedAt,
      state: allSlaughtered ? 'done' : 'live',
    });
  }
  if (total > 0) {
    updates.push({
      id: 'animals-scheduled',
      stage: 'program',
      title: `${total} ${total === 1 ? 'animal' : 'animals'} scheduled`,
      detail: 'Overall Udhiyya animal count finalized for the programme.',
      at: input.allocatedAt ?? input.openedAt ?? input.createdAt,
      state: 'done',
    });
  }
  updates.push({
    id: 'program-opened',
    stage: 'program',
    title: 'Programme opened',
    detail: 'Public ledger and community Udhiyya cycle opened.',
    at: input.openedAt ?? input.createdAt,
    state: 'done',
  });

  const overallPercent = total === 0
    ? (distributionStarted ? 100 : 0)
    : Math.min(100, Math.round(((cumSlaughtered + cumProcessing + cumCompleted) / (total * 3)) * 100));

  return {
    liveStage,
    overallPercent,
    animals: {
      total,
      pending,
      slaughtered: inSlaughter,
      processing: inProcessing,
      packed,
      cumulative: {
        slaughtered: cumSlaughtered,
        processing: cumProcessing,
        completed: cumCompleted,
      },
      milestones: {
        slaughterStartedAt,
        slaughterCompletedAt,
        processingStartedAt,
        processingCompletedAt,
        packingStartedAt,
        packingCompletedAt,
      },
      byType: Array.from(byTypeMap.values()),
    },
    distribution: {
      started: distributionStarted,
      startedAt: distributionStartedAt,
      packetsIssued,
      packetsHandedOut,
      householdsServed,
    },
    updates,
  };
}
