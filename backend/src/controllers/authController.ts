/**
 * @file authController.ts
 * @description Handles user authentication — registration and login.
 *
 * Flow:
 *  - POST /api/auth/register → validates uniqueness, hashes password via User model,
 *    returns user payload + signed JWT.
 *  - POST /api/auth/login → verifies credentials using bcrypt comparison,
 *    returns user payload + signed JWT on success.
 *
 * Tokens are signed with JWT_SECRET (env) and expire after 30 days.
 */

import { Request, Response } from 'express';
import User from '../models/User';
import jwt from 'jsonwebtoken';

/**
 * Generates a signed JWT for a given user ID.
 * @param id - MongoDB ObjectId string of the authenticated user
 * @returns Signed JWT string valid for 30 days
 */
const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d',
  });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user account
 * @access  Public
 */
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    const user = await User.create({ name, email, password });

    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        baseCurrency: user.baseCurrency,
        token: generateToken(user.id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return JWT
 * @access  Public
 */
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await (user as any).matchPassword(password))) {
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        baseCurrency: user.baseCurrency,
        token: generateToken(user.id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
