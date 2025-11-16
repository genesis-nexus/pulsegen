import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';

// Helper function to generate tokens
function generateTokens(userId: string) {
  const accessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

// Google OAuth
router.get('/google', passport.authenticate('google'));

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=google_auth_failed' }),
  (req, res) => {
    const user = req.user as any;
    const tokens = generateTokens(user.id);

    // Redirect to frontend with tokens
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${tokens.accessToken}&refresh=${tokens.refreshToken}`);
  }
);

// Microsoft OAuth
router.get('/microsoft', passport.authenticate('microsoft'));

router.get(
  '/microsoft/callback',
  passport.authenticate('microsoft', { session: false, failureRedirect: '/login?error=microsoft_auth_failed' }),
  (req, res) => {
    const user = req.user as any;
    const tokens = generateTokens(user.id);

    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${tokens.accessToken}&refresh=${tokens.refreshToken}`);
  }
);

// GitHub OAuth
router.get('/github', passport.authenticate('github'));

router.get(
  '/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: '/login?error=github_auth_failed' }),
  (req, res) => {
    const user = req.user as any;
    const tokens = generateTokens(user.id);

    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${tokens.accessToken}&refresh=${tokens.refreshToken}`);
  }
);

// SAML
router.get('/saml', passport.authenticate('saml'));

router.post(
  '/saml/callback',
  passport.authenticate('saml', { session: false, failureRedirect: '/login?error=saml_auth_failed' }),
  (req, res) => {
    const user = req.user as any;
    const tokens = generateTokens(user.id);

    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${tokens.accessToken}&refresh=${tokens.refreshToken}`);
  }
);

export default router;
