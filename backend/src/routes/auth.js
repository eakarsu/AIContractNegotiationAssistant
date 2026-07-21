'use strict';
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

function publicUser(user) {
  return { id: user.id, email: user.email, name: user.name, role: user.role, tenantId: user.tenantId };
}
function tokenFor(user) {
  return jwt.sign({ userId: user.id, email: user.email, role: user.role, tenantId: user.tenantId }, JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '8h' });
}
function validPassword(value) { return typeof value === 'string' && value.length >= 12 && value.length <= 128; }

router.post('/register', async (req, res) => {
  if (process.env.ALLOW_SELF_REGISTRATION !== 'true') {
    return res.status(403).json({ error: 'Self-registration is disabled; use the audited provisioning command' });
  }
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const name = String(req.body.name || '').trim();
    const password = req.body.password;
    const tenantId = String(process.env.SELF_REGISTRATION_TENANT_ID || '').trim();
    if (!email || !name || !tenantId || !validPassword(password)) return res.status(422).json({ error: 'email, name, configured tenant, and a 12-128 character password are required' });
    const user = await prisma.user.create({ data: { email, password: await bcrypt.hash(password, 12), name, role: 'negotiator', tenantId } });
    res.status(201).json({ user: publicUser(user), token: tokenFor(user) });
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ error: 'An account with this email already exists' });
    console.error('[auth/register]', error.message); res.status(503).json({ error: 'Registration unavailable' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase(); const password = String(req.body.password || '');
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ user: publicUser(user), token: tokenFor(user) });
  } catch (error) { console.error('[auth/login]', error.message); res.status(503).json({ error: 'Authentication service unavailable' }); }
});

router.get('/me', authMiddleware, async (req, res) => {
  const user = await prisma.user.findFirst({ where: { id: req.user.userId, tenantId: req.user.tenantId } });
  if (!user) return res.status(404).json({ error: 'user_not_found' });
  res.json(publicUser(user));
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) return res.status(422).json({ error: 'name is required' });
    const found = await prisma.user.findFirst({ where: { id: req.user.userId, tenantId: req.user.tenantId } });
    if (!found) return res.status(404).json({ error: 'user_not_found' });
    const user = await prisma.user.update({ where: { id: found.id }, data: { name } });
    res.json(publicUser(user));
  } catch (error) { console.error('[auth/profile]', error.message); res.status(503).json({ error: 'Profile update unavailable' }); }
});

router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    if (!validPassword(req.body.newPassword)) return res.status(422).json({ error: 'newPassword must contain 12-128 characters' });
    const user = await prisma.user.findFirst({ where: { id: req.user.userId, tenantId: req.user.tenantId } });
    if (!user || !(await bcrypt.compare(String(req.body.currentPassword || ''), user.password))) return res.status(400).json({ error: 'Current password is incorrect' });
    await prisma.user.update({ where: { id: user.id }, data: { password: await bcrypt.hash(req.body.newPassword, 12) } });
    res.json({ message: 'Password changed successfully' });
  } catch (error) { console.error('[auth/password]', error.message); res.status(503).json({ error: 'Password update unavailable' }); }
});

router.post('/forgot-password', (req, res) => res.status(503).json({
  error: 'Password reset is disabled until a verified delivery provider and one-time token store are configured',
}));
router.post('/reset-password', (req, res) => res.status(503).json({
  error: 'Password reset is disabled until a verified delivery provider and one-time token store are configured',
}));

module.exports = router;
