import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

export const adminMiddleware = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer '))
      return res.status(401).json({ message: 'Authorization token missing' });

    const token = header.split(' ')[1];
    const payload = jwt.verify(token, ACCESS_SECRET);

    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ message: 'User not found' });
    if (user.role !== 'admin')
      return res.status(403).json({ message: 'Admin access required' });

    req.user = user;
    next();
  } catch (err) {
    console.error('Admin Middleware Error:', err.message);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};
