/**
 * Unit tests for the "next 9pm Morocco time" calculation — no server, no database.
 * Morocco is not a fixed UTC+1: it pauses to UTC+0 for Ramadan on dates that move
 * every year, so these specifically exercise that the IANA data is actually being
 * consulted rather than a hard-coded offset.
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { nextDailyCutoff } = require('../config/dailyCutoff');

const opts = { hour: 21, timeZone: 'Africa/Casablanca' };
const hoursBetween = (a, b) => (b.getTime() - a.getTime()) / 3600000;

test('login at 8am Morocco gets a cutoff the same day, ~13h away', () => {
    const from = new Date('2026-10-18T07:00:00Z');   // 08:00 in UTC+1
    const cutoff = nextDailyCutoff(from, opts);
    assert.equal(cutoff.toISOString(), '2026-10-18T20:00:00.000Z');   // 21:00 local
    assert.equal(hoursBetween(from, cutoff), 13);
});

test('login at 10pm — after today\'s cutoff — rolls to tomorrow, not a past instant', () => {
    const from = new Date('2026-10-18T21:00:00Z');   // 22:00 local
    const cutoff = nextDailyCutoff(from, opts);
    assert.ok(cutoff.getTime() > from.getTime(), 'cutoff must be in the future');
    assert.equal(cutoff.toISOString(), '2026-10-19T20:00:00.000Z');
});

test('logging in at the exact cutoff instant counts as past it ("strictly after")', () => {
    const from = new Date('2026-10-18T20:00:00Z');   // exactly 21:00 local
    const cutoff = nextDailyCutoff(from, opts);
    assert.ok(cutoff.getTime() > from.getTime(), 'the cutoff instant itself must not be returned');
    assert.equal(cutoff.toISOString(), '2026-10-19T20:00:00.000Z');
});

test('one minute before the cutoff yields a near-zero, not negative, lifetime', () => {
    const from = new Date('2026-10-18T19:59:00Z');
    const cutoff = nextDailyCutoff(from, opts);
    assert.equal(Math.round((cutoff - from) / 60000), 1);
});

test('during Ramadan (UTC+0), the cutoff still lands at 9pm local, not 9pm UTC+1', () => {
    // 2024-03-15 falls inside that year's Ramadan pause, when Morocco sits at UTC+0.
    const from = new Date('2024-03-15T08:00:00Z');   // 08:00 local (offset +0)
    const cutoff = nextDailyCutoff(from, opts);
    assert.equal(cutoff.toISOString(), '2024-03-15T21:00:00.000Z', 'should be 21:00 UTC, i.e. 21:00 local at +0');
});

test('outside Ramadan the offset is +1h, confirming the rule genuinely differs by date', () => {
    // October never overlaps Ramadan under the current calendar drift, so this is
    // safely outside it, unlike the March test above.
    const from = new Date('2026-10-18T08:00:00Z');
    const cutoff = nextDailyCutoff(from, opts);
    assert.equal(cutoff.toISOString(), '2026-10-18T20:00:00.000Z', '21:00 local at +1 is 20:00 UTC');
});

test('a different cutoff hour is honored', () => {
    const from = new Date('2026-10-18T07:00:00Z');
    const cutoff = nextDailyCutoff(from, { hour: 18, timeZone: 'Africa/Casablanca' });
    assert.equal(cutoff.toISOString(), '2026-10-18T17:00:00.000Z');   // 18:00 local
});

test('a different timezone is honored (sanity check the zone is not hard-coded)', () => {
    const from = new Date('2026-10-18T07:00:00Z');
    const cutoffParis = nextDailyCutoff(from, { hour: 21, timeZone: 'Europe/Paris' });   // UTC+2 in October (DST)
    assert.equal(cutoffParis.toISOString(), '2026-10-18T19:00:00.000Z');
});

test('defaults to Africa/Casablanca at 21:00 with no options', () => {
    const from = new Date('2026-10-18T07:00:00Z');
    const cutoff = nextDailyCutoff(from);
    assert.equal(cutoff.toISOString(), '2026-10-18T20:00:00.000Z');
});
