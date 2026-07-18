import * as authService from './service.js';
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js';
import globalResponse from '../../utils/responses&Errors/globalResponse.js';
import dotenv from '../../config/dotenv.js';

const isProduction = dotenv('NODE_ENV') === 'production';

/**
 * Handle user sign-up.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.body - Request body containing user registration data
 * @param {string} req.body.email - User email address
 * @param {string} req.body.password - User password
 * @param {string} req.body.name - User display name
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Creates new user account and returns user object
 */
export const signUp = handleCatchErrorAsync(async (req, res) => {
  const { body } = req;
  const user = await authService.signUp(body);
  globalResponse(res, 201, user);
});

/**
 * Handle user sign-in authentication.
 * Authenticates user credentials and sets secure HTTP-only cookies for refresh token
 * and CSRF token for security.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.body - Request body containing login credentials
 * @param {string} req.body.email - User email address
 * @param {string} req.body.password - User password
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Authenticates user and returns user data with security tokens
 */
export const signIn = handleCatchErrorAsync(async (req, res) => {
  const body = req.body;
  const user = await authService.signIn(body, req);
  // Creates Secure Cookie with refresh token
  res.cookie('jwt', user.refreshToken, {
    httpOnly: true,
    secure: true, // <-- should be false in LOCAL, true in production
    sameSite: 'none',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000 /** 24 hours */,
  });
  // token csrtoken
  res.cookie('csrfToken', user.csrfToken, {
    httpOnly: false, // accessible by frontend
    secure: true, //  <-- should be false in LOCAL, true in production
    sameSite: 'none',
    path: '/',
  });
  // deletion of user object before sending response
  delete user.refreshToken;
  delete user.csrfToken;

  globalResponse(res, 200, user);
});

/**
 * Retrieve the user session.
 * Gets current user session data based on authenticated user ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {string} req.userId - Authenticated user ID from token verification
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Returns user session data including profile information
 */
export const session = handleCatchErrorAsync(async (req, res) => {
  const userId = req.userId;
  const userSession = await authService.session(userId);
  globalResponse(res, 200, userSession);
});

/**
 * Refresh the user token.
 * Rotates refresh token and generates new access token for continued session.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.cookies - Request cookies containing refresh token
 * @param {string} req.cookies.jwt - HTTP-only refresh token cookie
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Returns new access token and updates refresh token cookie
 */
export const refreshToken = handleCatchErrorAsync(async (req, res) => {
  const cookies = req.cookies;
  const data = await authService.refreshToken(cookies, req);
  // Creates Secure Cookie with refresh token
  res.cookie('jwt', data.refreshToken, {
    httpOnly: true, // so it's not accessible by frontend
    secure: true, // <-- should be false in LOCAL, true in production
    sameSite: 'none',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000 /** 24 hours */,
  });
  // token csrtoken
  res.cookie('csrfToken', data.csrfToken, {
    httpOnly: false, // accessible by frontend
    secure: true, // <-- should be false in LOCAL, true in production
    sameSite: 'none',
    path: '/',
  });
  // deletion of user object before sending response
  delete data.refreshToken;
  delete data.csrfToken;
  globalResponse(res, 200, { accessToken: data.accessToken });
});

/**
 * Log out the user.
 * Revokes refresh token and clears authentication cookies to terminate session.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.cookies - Request cookies containing refresh token
 * @param {string} req.cookies.jwt - HTTP-only refresh token cookie to revoke
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Clears session and returns logout confirmation
 */
export const logOut = handleCatchErrorAsync(async (req, res) => {
  // Clear the refresh token cookie
  const cookies = req.cookies;
  // revoke refresh token
  await authService.logout(cookies);
  res.cookie('jwt', '', {
    httpOnly: true,
    secure: isProduction, // <-- should be false in LOCAL, true in production
    sameSite: 'none',
    path: '/',
    expires: new Date(0),
  });
  globalResponse(res, 200, { message: 'Logged out successfully' });
});

/**
 * Change user password.
 * Updates user password after validating current password and new password requirements.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.body - Request body containing password data
 * @param {string} req.body.currentPassword - User's current password for verification
 * @param {string} req.body.newPassword - New password to set
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Updates password and returns confirmation
 */
export const changePassword = () => {};
