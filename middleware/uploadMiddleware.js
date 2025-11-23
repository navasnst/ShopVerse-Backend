
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ✅ Dynamic folder based on request path
const getUploadPath = (req, file) => {
  // Product image upload
  if (
    req.originalUrl.includes("/products") ||
    file.fieldname === "productImage" ||
    file.fieldname === "image"
  ) {
    return path.join(__dirname, "../uploads/productImages");
  }

  // ✅ Admin profile image upload
  if (req.originalUrl.includes("/admin/profile")) {
    return path.join(__dirname, "../uploads/profileImages");
  }

  // Default user profile
  return path.join(__dirname, "../uploads/profileImages");
};

// ✅ Ensure folder exists
const ensureUploadPath = (uploadPath) => {
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
    console.log("📁 Created upload directory:", uploadPath);
  }
};

// ✅ Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = getUploadPath(req, file);
    ensureUploadPath(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// ✅ File type filter
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();

  if (allowed.test(ext) && allowed.test(mime)) cb(null, true);
  else cb(new Error("❌ Only .jpeg, .jpg, .png, .webp formats are allowed!"));
};

// ✅ Export multer
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = upload;

