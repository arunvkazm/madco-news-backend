import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

export const adminMiddleware = async (req, res, next) => {
  try {
    // Check cookies first, then Authorization header (consistent with auth middleware)
    let token = req.cookies?.access_token;
    
    if (!token) {
      const header = req.headers.authorization;
      if (header && header.startsWith("Bearer ")) {
        token = header.split(" ")[1];
      }
    }
    
    if (!token) {
      return res.status(401).json({ message: "Authorization token missing" });
    }

    const payload = jwt.verify(token, ACCESS_SECRET);

    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ message: "User not found" });
    if (!["super_admin", "sub_admin", "editor"].includes(user.role))
      return res.status(403).json({ message: "Admin access required" });

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

