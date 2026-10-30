// Opening hours, always in Kenya time (UTC+3, no daylight saving)
const TZ_OFFSET_MIN = 180;
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function local(now = new Date()) {
  const d = new Date(now.getTime() + TZ_OFFSET_MIN * 60000);
  return { day: d.getUTCDay(), mins: d.getUTCHours() * 60 + d.getUTCMinutes() };
}
const toMins = (t, dflt) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t || '');
  return m ? Number(m[1]) * 60 + Number(m[2]) : dflt;
};

// Returns { open, text, reason }
export function branchStatus(branch, now = new Date()) {
  if (!branch) return { open: false, text: 'Closed', reason: 'no-branch' };
  const openT = branch.openTime || '08:00';
  const closeT = branch.closeTime || '22:00';
  if (branch.isOpen === false) return { open: false, text: 'Closed today', reason: 'manual' };

  const open = toMins(openT, 480), close = toMins(closeT, 1320);
  const closedDays = Array.isArray(branch.closedDays) ? branch.closedDays : [];
  const { day, mins } = local(now);
  const overnight = close <= open; // e.g. 18:00 – 02:00
  // for overnight hours, the early-morning part belongs to the previous day
  const shiftDay = overnight && mins < close ? (day + 6) % 7 : day;
  const inHours = open === close ? true : overnight ? (mins >= open || mins < close) : (mins >= open && mins < close);

  if (inHours && !closedDays.includes(shiftDay)) return { open: true, text: `Open until ${closeT}`, reason: 'hours' };

  // find when it next opens
  for (let i = 0; i < 8; i++) {
    const d = (day + i) % 7;
    if (closedDays.includes(d)) continue;
    if (i === 0 && mins < open) return { open: false, text: `Closed · opens at ${openT}`, reason: 'hours' };
    if (i === 1) return { open: false, text: `Closed · opens tomorrow at ${openT}`, reason: 'hours' };
    if (i > 1) return { open: false, text: `Closed · opens ${DAYS[d]} at ${openT}`, reason: 'hours' };
  }
  return { open: false, text: 'Closed', reason: 'hours' };
}
