// Vercel serverless entrypoint — wraps the existing Express app as a single function.
// All requests (rewritten via vercel.json) land here; Express handles routing internally.
module.exports = require('../app');
