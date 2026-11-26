// Must be used AFTER protect. Lets only admins continue.
export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ success: false, message: "Access denied. Admins only." });
};
