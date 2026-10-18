/**
 * Unit tests for the "next 9pm Morocco time" calculation — no server, no database.
 *
 * Morocco's rule is not stable enough to hard-code: UTC+1 year-round with a pause
 * to UTC+0 for Ramadan from 2018, then abolished in favor of a permanent UTC+0
 * from 20 September 2026. These exercise that the real rule — and its history,
 * and the exact transition moment — are actually being consulted, via
 * moment-timezone's bundled data rather than the host's own tzdata (see the
 * comment in dailyCutoff.js for why that distinction mattered in practice).
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { nextDailyCutoff } = require('../config/dailyCutoff');

const opts = { hour: 21, timeZone: 'Africa/Casablanca' };
const hoursBetween = (a, b) => (b.getTime() - a.getTime()) / 3600000;

// ── Current era: permanent UTC+0, from 20 September 2026 onward ────────────────

test('login at 8am Morocco gets a cutoff the same day, ~13h away', () => {
    const from = new Date('2026-10-18T07:00:00Z');   // 08:00 local at UTC+0
    const cutoff = nextDailyCutoff(from, opts);
    assert.equal(cutoff.toISOString(), '2026-10-18T21:00:00.000Z');
    assert.equal(hoursBetween(from, cutoff), 14);
});

test('login at 10pm — after today\'s cutoff — rolls to tomorrow, not a past instant', () => {
    const from = new Date('2026-10-18T22:00:00Z');
    const cutoff = nextDailyCutoff(from, opts);
    assert.ok(cutoff.getTime() > from.getTime(), 'cutoff must be in the future');
    assert.equal(cutoff.toISOString(), '2026-10-19T21:00:00.000Z');
});

test('logging in at the exact cutoff instant counts as past it ("strictly after")', () => {
    const from = new Date('2026-10-18T21:00:00Z');
    const cutoff = nextDailyCutoff(from, opts);
    assert.ok(cutoff.getTime() > from.getTime(), 'the cutoff instant itself must not be returned');
    assert.equal(cutoff.toISOString(), '2026-10-19T21:00:00.000Z');
});

test('one minute before the cutoff yields a near-zero, not negative, lifetime', () => {
    const from = new Date('2026-10-18T20:59:00Z');
    const cutoff = nextDailyCutoff(from, opts);
    assert.equal(Math.round((cutoff - from) / 60000), 1);
});

test('well into the future, still permanently UTC+0 (no seasonal toggle left to break)', () => {
    const from = new Date('2027-07-01T06:00:00Z');
    const cutoff = nextDailyCutoff(from, opts);
    assert.equal(cutoff.toISOString(), '2027-07-01T21:00:00.000Z');
});

// ── Historical correctness: the old rule, before the 2026 change ───────────────

test('August 2026 (old rule: permanent UTC+1 outside Ramadan)', () => {
    const from = new Date('2026-08-15T07:00:00Z');
    const cutoff = nextDailyCutoff(from, opts);
    assert.equal(cutoff.toISOString(), '2026-08-15T20:00:00.000Z', '21:00 local at +1 is 20:00 UTC');
});

test('Ramadan 2026, before the permanent switch (old rule: UTC+0 during Ramadan)', () => {
    const from = new Date('2026-02-20T08:00:00Z');
    const cutoff = nextDailyCutoff(from, opts);
    assert.equal(cutoff.toISOString(), '2026-02-20T21:00:00.000Z');
});

test('the exact moment of the 20 September 2026 transition is honored', () => {
    // 19 Sep 20:30 UTC is 21:30 local under the still-active old +1 rule — already
    // past that day's 21:00 cutoff, so it rolls to "tomorrow" (20 Sep) at 21:00
    // local. The transition to permanent +0 lands at 02:00 local on the 20th,
    // hours before that 21:00 — so the correct target uses the NEW rule.
    const from = new Date('2026-09-19T20:30:00Z');
    const cutoff = nextDailyCutoff(from, opts);
    assert.equal(cutoff.toISOString(), '2026-09-20T21:00:00.000Z', 'should resolve under the new post-transition rule');
});

// ── Configurability ──────────────────────────────────────────────────────────

test('a different cutoff hour is honored', () => {
    const from = new Date('2026-10-18T07:00:00Z');
    const cutoff = nextDailyCutoff(from, { hour: 18, timeZone: 'Africa/Casablanca' });
    assert.equal(cutoff.toISOString(), '2026-10-18T18:00:00.000Z');
});

test('a different timezone is honored (sanity check the zone is not hard-coded)', () => {
    const from = new Date('2026-10-18T07:00:00Z');
    const cutoffParis = nextDailyCutoff(from, { hour: 21, timeZone: 'Europe/Paris' });   // UTC+2 in October (DST)
    assert.equal(cutoffParis.toISOString(), '2026-10-18T19:00:00.000Z');
});

test('defaults to Africa/Casablanca at 21:00 with no options', () => {
    const from = new Date('2026-10-18T07:00:00Z');
    const cutoff = nextDailyCutoff(from);
    assert.equal(cutoff.toISOString(), '2026-10-18T21:00:00.000Z');
});
