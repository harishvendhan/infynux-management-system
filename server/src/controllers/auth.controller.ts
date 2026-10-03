import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { config } from '../config/env';

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: { message: 'Email and password are required.', code: 'INVALID_CREDENTIALS' } });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      res.status(401).json({ error: { message: 'Invalid email or password.', code: 'INVALID_CREDENTIALS' } });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: { message: 'Invalid email or password.', code: 'INVALID_CREDENTIALS' } });
      return;
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role, name: user.name },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    // Set HTTP-only secure cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    });

    res.status(200).json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      error: null,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: { message: 'An unexpected error occurred during login.', code: 'SERVER_ERROR' } });
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  res.clearCookie('token', {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
    path: '/',
  });

  res.status(200).json({ data: { message: 'Logged out successfully.' }, error: null });
}

export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: { message: 'Unauthorized.', code: 'UNAUTHORIZED' } });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    if (!user) {
      res.status(404).json({ error: { message: 'User not found.', code: 'USER_NOT_FOUND' } });
      return;
    }

    res.status(200).json({ data: { user }, error: null });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message, code: 'SERVER_ERROR' } });
  }
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: { message: 'Unauthorized.', code: 'UNAUTHORIZED' } });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword || newPassword.length < 12) {
      res.status(400).json({
        error: { message: 'New password must be at least 12 characters long.', code: 'INVALID_PASSWORD' },
      });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      res.status(404).json({ error: { message: 'User not found.', code: 'USER_NOT_FOUND' } });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ error: { message: 'Incorrect current password.', code: 'INCORRECT_PASSWORD' } });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashedPassword },
    });

    res.status(200).json({ data: { message: 'Password updated successfully.' }, error: null });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message, code: 'SERVER_ERROR' } });
  }
}
