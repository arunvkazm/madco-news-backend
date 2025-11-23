// src/middlewares/auth.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

export async function auth(req, res, next) {
  try {
    // Check cookies first, then Authorization header
    let token = req.cookies?.access_token;
    
    if (!token) {
      const header = req.headers.authorization;
      if (header && header.startsWith('Bearer ')) {
        token = header.split(' ')[1];
      }
    }
    
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    
    const payload = jwt.verify(token, ACCESS_SECRET);
    // Attach user info
    req.user = { id: payload.sub, role: payload.role };
    // Optionally: load full user
    req.currentUser = await User.findById(payload.sub).select('-password');
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    const userRole = req.user?.role;
    if (!userRole) return res.status(403).json({ message: 'Forbidden' });
    if (Array.isArray(role) ? !role.includes(userRole) : userRole !== role) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}
