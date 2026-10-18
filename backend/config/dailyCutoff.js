/**
 * "Next CUTOFF_HOUR:00 in CUTOFF_TZ" — the wall-clock moment a daily session dies.
 *
 * This deliberately does NOT use the host's built-in Intl/ICU timezone data.
 * Morocco's rule has changed more than once in recent years — UTC+1 year-round
 * with a pause to UTC+0 for Ramadan from 2018, then abolished entirely in favor of
 * a permanent UTC+0 from 20 September 2026 — and different Node builds and OSes
 * pick up such changes on their own schedules. A machine's local Node (built
 * before the change) and Vercel's production runtime (built after it) can
 * legitimately disagree about "right now" in Morocco on the very same day — which
 * is exactly what happened while building this. moment-timezone bundles its own
 * IANA snapshot as package data, so the answer depends on the moment-timezone
 * version pinned in package.json, not on whichever environment happens to run it —
 * and it is bumped independently of Node/OS updates when Morocco changes its rule
 * again.
 */
const moment = require('moment-timezone');

/**
 * The next occurrence of `hour`:00 in `timeZone` that is strictly after `from`.
 *
 * Logging in at 8am gets a cutoff of 9pm that same day. Logging in at 10pm — after
 * that day's cutoff has already passed — gets 9pm the *next* day rather than an
 * expiry that is already in the past.
 */
function nextDailyCutoff(from = new Date(), { hour = 21, timeZone = 'Africa/Casablanca' } = {}) {
    let candidate = moment.tz(from, timeZone).hour(hour).minute(0).second(0).millisecond(0);
    if (!candidate.isAfter(from)) candidate = candidate.add(1, 'day');
    return candidate.toDate();
}

module.exports = { nextDailyCutoff };
