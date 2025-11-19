export const requireRole = (...allowed) => {
  return (req, res, next) => {
    try {
      if (!req.user)
        return res.status(401).json({ message: "Not authenticated" });

      if (!allowed.includes(req.user.role))
        return res.status(403).json({
          message: `Access denied for role '${req.user.role}'`
        });

      next();
    } catch (err) {
      res.status(401).json({ message: "Unauthorized" });
    }
  };
};
