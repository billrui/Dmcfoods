import AdminLog from '../models/AdminLog.js';

// Records every successful change (POST/PUT/PATCH/DELETE) made through the admin API,
// unless the route already logged itself with logAdminAction().
const SKIP_BODY = ['password', 'newPassword', 'currentPassword', 'tempPassword', 'token'];

function cleanBody(body) {
  if (!body || typeof body !== 'object') return undefined;
  const out = {};
  for (const [k, v] of Object.entries(body)) {
    if (SKIP_BODY.includes(k)) continue;
    out[k] = typeof v === 'string' && v.length > 200 ? v.slice(0, 200) + '…' : v;
  }
  return Object.keys(out).length ? out : undefined;
}

export function adminActivityLogger(req, res, next) {
  if (req.method === 'GET' || req.method === 'OPTIONS') return next();
  res.on('finish', () => {
    if (res.statusCode >= 400 || !req.user?._id || res.locals.adminLogged) return;
    const path = (req.baseUrl + req.path).replace(/^\/api\/(admin|super)\//, '');
    AdminLog.create({
      admin: req.user._id,
      action: `${req.method} ${path}`,
      target: req.params?.id,
      details: cleanBody(req.body),
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    }).catch(e => console.error('activity log failed:', e.message));
  });
  next();
}

export function logEvent(req, user, action, details) {
  return AdminLog.create({
    admin: user._id, action, details,
    ip: req.ip, userAgent: req.headers['user-agent'],
  }).catch(e => console.error('activity log failed:', e.message));
}
