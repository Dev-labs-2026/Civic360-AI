import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import getJwtSecret from '../utils/jwtSecret.js';

/**
 * Protect routes - Authenticate JWT token
 */
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, getJwtSecret());
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please log in again.',
    });
  }

  try {
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
    }
    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
};

/**
 * Grant access to specific roles (citizen, officer, admin)
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user?.role || 'anonymous'}' is not authorized to access this resource.`,
      });
    }
    next();
  };
};
