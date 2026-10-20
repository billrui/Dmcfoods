import AdminLog from '../models/AdminLog.js';

export function logAdminAction(action, getTarget) {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = async (body) => {
      try {
        if (res.statusCode < 400) {
          await AdminLog.create({
            admin: req.user._id,
            action,
            target: typeof getTarget === 'function' ? getTarget(req, body) : req.params.id,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
          });
        }
      } catch (e) {
        console.error('admin log failed:', e.message);
      }
      return originalJson(body);
    };
    next();
  };
}
