/**
 * "Next CUTOFF_HOUR:00 in CUTOFF_TZ" — the wall-clock moment a daily session dies.
 *
 * Morocco does not sit at a fixed UTC offset: it is UTC+1 year-round except for a
 * pause to UTC+0 during Ramadan, on dates that move every year. A hard-coded offset
 * would be wrong for roughly a month a year. The IANA tz database (Africa/Casablanca)
 * already encodes those exact dates, and Node's built-in Intl reads it — so this asks
 * Intl rather than carrying the rule ourselves.
 */

const localYMD = (date, timeZone) => {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(date);
    const get = (type) => Number(parts.find((p) => p.type === type).value);
    return { y: get('year'), m: get('month'), d: get('day') };
};

// How far `timeZone`'s wall clock is ahead of UTC at `date`, in minutes.
const offsetMinutesAt = (date, timeZone) => {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone, hour12: false,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(date);
    const get = (type) => Number(parts.find((p) => p.type === type).value);
    const hour = get('hour') % 24;   // Intl can print midnight as "24" with hour12: false
    const asUTC = Date.UTC(get('year'), get('month') - 1, get('day'), hour, get('minute'), get('second'));
    return (asUTC - date.getTime()) / 60000;
};

// The UTC instant that is CUTOFF_HOUR:00:00 local time on the given local calendar
// day. Two passes: the first pass's offset locates the right instant; the second
// re-derives the offset from that instant itself, in case a Ramadan transition falls
// between "now" and the cutoff (it never does at a fixed evening hour in practice —
// transitions land near 2-3am local — but this makes the result correct rather than
// merely usually correct).
const instantAt = ({ y, m, d }, hour, timeZone) => {
    let offset = offsetMinutesAt(new Date(Date.UTC(y, m - 1, d, hour, 0, 0)), timeZone);
    let utcMs = Date.UTC(y, m - 1, d, hour, 0, 0) - offset * 60000;
    offset = offsetMinutesAt(new Date(utcMs), timeZone);
    utcMs = Date.UTC(y, m - 1, d, hour, 0, 0) - offset * 60000;
    return new Date(utcMs);
};

/**
 * The next occurrence of `hour`:00 in `timeZone` that is strictly after `from`.
 *
 * Logging in at 8am gets a cutoff of 9pm that same day. Logging in at 10pm — after
 * that day's cutoff has already passed — gets 9pm the *next* day rather than an
 * expiry that is already in the past.
 */
function nextDailyCutoff(from = new Date(), { hour = 21, timeZone = 'Africa/Casablanca' } = {}) {
    const today = localYMD(from, timeZone);
    const todayCutoff = instantAt(today, hour, timeZone);
    if (todayCutoff.getTime() > from.getTime()) return todayCutoff;

    // Already past today's cutoff: step forward a nominal day in UTC, then re-read
    // the local calendar date from that instant — correct even across a Ramadan
    // offset change, unlike adding 24h to the local Y/M/D by hand.
    const tomorrow = localYMD(new Date(from.getTime() + 24 * 60 * 60 * 1000), timeZone);
    return instantAt(tomorrow, hour, timeZone);
}

module.exports = { nextDailyCutoff };
