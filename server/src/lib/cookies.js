const isProd = process.env.NODE_ENV === 'production';

export const REFRESH_COOKIE = 'dmc_refresh';

export const refreshCookieOptions = {
  httpOnly: true,
  secure: isProd,
  // strict when shop + API share a domain; set COOKIE_SAMESITE=none for two *.onrender.com addresses
  sameSite: (process.env.COOKIE_SAMESITE || 'strict').toLowerCase(),
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
