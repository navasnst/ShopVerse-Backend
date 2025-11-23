
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Seller = require("../models/Seller");
const Admin = require("../models/Admin");

// ✅ Protect middleware (verify token + attach user)
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Search in all collections
      req.user =
        (await User.findById(decoded.id).select("-password")) ||
        (await Seller.findById(decoded.id).select("-password")) ||
        (await Admin.findById(decoded.id).select("-password"));

      if (!req.user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      req.role = req.user.role;
      next();
    } catch (error) {
      console.error("Auth Error:", error.message);
      return res.status(401).json({ success: false, message: "Not authorized, token failed" });
    }
  } else {
    return res.status(401).json({ success: false, message: "Not authorized, no token" });
  }
};

// ✅ Role-based access control
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    const currentRole = req.user?.role || req.role;
    if (!currentRole) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }
    if (!roles.includes(currentRole)) {
      return res.status(403).json({ success: false, message: "Access denied: insufficient role" });
    }
    next();
  };
};
