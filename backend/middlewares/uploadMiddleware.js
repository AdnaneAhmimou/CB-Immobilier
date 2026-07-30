const multer = require('multer');

// Memory storage — Vercel's filesystem is ephemeral/read-only, so files are held in
// a buffer and streamed straight to Cloudinary instead of ever touching local disk.
exports.upload = multer({ storage: multer.memoryStorage() });
