import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Complaint from '../models/Complaint.js';
import getJwtSecret from '../utils/jwtSecret.js';
import { DEMO_PERSONAS, getDemoPersonaForUser } from '../utils/demoAccounts.js';

// Helper to generate JWT token
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    getJwtSecret(),
    { expiresIn: '30d' }
  );
};

/**
 * @desc    Register a new user (Citizen, Officer, or Admin)
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res) => {
  try {
    const { name, email, password, phone, department, ward } = req.body;

    // Public registration can never create privileged accounts. Explicitly
    // reject privileged role requests instead of silently honoring them.
    if (req.body.role !== undefined && req.body.role !== 'citizen') {
      return res.status(403).json({ success: false, message: 'Public registration is limited to citizen accounts.' });
    }

    if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string'
      || (phone !== undefined && typeof phone !== 'string') || (ward !== undefined && typeof ward !== 'string')) {
      return res.status(400).json({ success: false, message: 'Invalid registration details.' });
    }

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email and password',
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password,
      phone: phone || '',
      role: 'citizen',
      department: 'General Civic Department',
      ward: ward || 'Kolkata • Ward 12',
    });

    const token = generateToken(user._id, user.role);

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        department: user.department,
        ward: user.ward,
        state: user.state,
        country: user.country,
        isDemo: user.isDemo,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to register account. Check the submitted details and try again.',
    });
  }
};

/**
 * @desc    Login user & get JWT token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        department: user.department,
        ward: user.ward,
        state: user.state,
        country: user.country,
        isDemo: user.isDemo,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during login',
    });
  }
};

/**
 * @desc    Start a controlled demo session for a seeded demo persona
 * @route   POST /api/auth/demo
 * @access  Public in local development only
 */
export const demoLogin = async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ success: false, message: 'Demo access is unavailable.' });
  }

  try {
    const personaId = req.body?.persona;
    if (typeof personaId !== 'string' || !Object.hasOwn(DEMO_PERSONAS, personaId)) {
      return res.status(400).json({ success: false, message: 'Select a valid demo role.' });
    }
    const persona = DEMO_PERSONAS[personaId];

    const user = await User.findOne({ email: persona.email, role: persona.role });
    if (!user || getDemoPersonaForUser(user)?.id !== persona.id) {
      return res.status(404).json({ success: false, message: 'This demo role is not available.' });
    }

    const token = generateToken(user._id, user.role);
    return res.status(200).json({
      success: true,
      message: 'Demo session started',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        department: user.department,
        ward: user.ward,
        state: user.state,
        country: user.country,
        isDemo: true,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Demo login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Demo sign-in is temporarily unavailable.',
    });
  }
};

/**
 * @desc    Get currently logged in user info
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get quick stats for this user
    let userStats = {};
    if (user.role === 'citizen') {
      const total = await Complaint.countDocuments({ citizen: user._id });
      const resolved = await Complaint.countDocuments({ citizen: user._id, status: 'Resolved' });
      const pending = await Complaint.countDocuments({ citizen: user._id, status: 'Pending' });
      userStats = { total, resolved, pending };
    } else if (user.role === 'officer') {
      const assigned = await Complaint.countDocuments({ assignedOfficer: user._id });
      const resolved = await Complaint.countDocuments({ assignedOfficer: user._id, status: 'Resolved' });
      userStats = { assigned, resolved };
    }

    const userPayload = user.toObject();
    userPayload.isDemo = Boolean(user.isDemo || getDemoPersonaForUser(user));

    return res.status(200).json({
      success: true,
      user: userPayload,
      stats: userStats,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update current user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, ward } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (ward) user.ward = ward;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        department: user.department,
        ward: user.ward,
        state: user.state,
        country: user.country,
        isDemo: user.isDemo,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
