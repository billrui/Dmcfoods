const isProd = process.env.NODE_ENV === 'production';

export const REFRESH_COOKIE = 'dmc_refresh';

export const refreshCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'strict',
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
