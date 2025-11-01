import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

export const adminMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer '))
      return res.status(401).json({ message: 'Authorization token missing' });

    const token = authHeader.split(' ')[1];

    let payload;
    try {
      payload = jwt.verify(token, ACCESS_SECRET);

    } catch (err) {
      console.log(err.name, err.message); // DEBUG
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ message: 'User not found' });
    if (user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });

    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};
