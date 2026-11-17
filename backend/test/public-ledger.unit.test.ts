import assert from 'node:assert/strict';
import { test } from 'node:test';
import { summarizePublicOperations } from '../src/modules/expenses/public.logic.js';

const t = (h: number) => new Date(`2027-02-02T0${h}:00:00.000Z`);

test('public ledger summarizes overall cumulative slaughter, processing, completion, and distribution updates', () => {
  const result = summarizePublicOperations({
    programStatus: 'OPEN',
    openedAt: t(1),
    allocatedAt: t(2),
    createdAt: t(1),
    animals: [
      { animalType: 'COW', status: 'PACKED', slaughteredAt: t(3), processingAt: t(4), packedAt: t(5) },
      { animalType: 'COW', status: 'PROCESSING', slaughteredAt: t(3), processingAt: t(4), packedAt: null },
      { animalType: 'GOAT', status: 'PENDING', slaughteredAt: null, processingAt: null, packedAt: null },
    ],
    packetsIssued: 40,
    packetsHandedOut: 26,
    householdsServed: 6,
    firstIssueAt: t(6),
    firstHandoverAt: t(7),
    lastHandoverAt: t(8),
  });

  assert.equal(result.liveStage, 'DISTRIBUTING');
  assert.equal(result.animals.total, 3);
  assert.equal(result.animals.pending, 1);
  assert.equal(result.animals.cumulative.slaughtered, 2);
  assert.equal(result.animals.cumulative.processing, 2);
  assert.equal(result.animals.cumulative.completed, 1);
  assert.equal(result.animals.byType.length, 2);
  assert.equal(result.distribution.started, true);
  assert.equal(result.distribution.packetsHandedOut, 26);
  assert.deepEqual(result.updates.map(u => u.stage), ['distribution', 'completed', 'processing', 'slaughter', 'program', 'program']);
});

test('public ledger detects full animal completion before distribution starts', () => {
  const result = summarizePublicOperations({
    programStatus: 'OPEN',
    openedAt: t(1),
    allocatedAt: t(2),
    createdAt: t(1),
    animals: [
      { animalType: 'GOAT', status: 'PACKED', slaughteredAt: t(3), processingAt: t(4), packedAt: t(5) },
    ],
    packetsIssued: 0,
    packetsHandedOut: 0,
    householdsServed: 0,
    firstIssueAt: null,
    firstHandoverAt: null,
    lastHandoverAt: null,
  });

  assert.equal(result.liveStage, 'COMPLETED');
  assert.equal(result.overallPercent, 100);
  assert.equal(result.distribution.started, false);
  assert.equal(result.updates[0]?.title, 'All animals completed & packed');
});
