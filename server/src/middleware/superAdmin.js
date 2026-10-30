import { requireAuth } from './auth.js';

export function requireSuperAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (!req.user?.isAdmin || !req.user?.isSuperAdmin) {
      return res.status(403).json({ error: 'Super admin only' });
    }
    next();
  });
}
