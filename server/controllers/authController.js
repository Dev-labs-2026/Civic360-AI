import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Complaint from '../models/Complaint.js';

// Helper to generate JWT token
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'civic360_super_secret_jwt_key_2026_india',
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
    const { name, email, password, phone, role = 'citizen', department, ward } = req.body;

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
      role: ['citizen', 'officer', 'admin'].includes(role) ? role : 'citizen',
      department: department || 'General',
      ward: ward || 'Ward 12 - Indiranagar',
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
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration',
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

    if (!email || !password) {
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

    return res.status(200).json({
      success: true,
      user,
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
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
