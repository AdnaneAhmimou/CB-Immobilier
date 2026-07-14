const express = require('express');
const cors = require('cors');
const path = require('path');
const errorMiddleware = require('./middlewares/errorMiddleware');

const clientRoutes = require('./routes/clientRoutes');
const bienRoutes = require('./routes/bienRoutes');
const documentRoutes = require('./routes/documentRoutes');
const visiteRoutes = require('./routes/visiteRoutes');
const offreRoutes = require('./routes/offreRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const statsRoutes = require('./routes/statsRoutes');
const agentRoutes = require('./routes/agentRoutes');
const bienTypeRoutes = require('./routes/bienTypeRoutes');
const contactRoutes  = require('./routes/contactRoutes');

const app = express();

app.use(cors());
app.use(express.json());
// etag/lastModified disabled: weak validators + range requests on this route were producing
// intermittently corrupted images that "fixed themselves" after a few reloads (stale/partial
// cached response reused instead of a clean re-fetch). Range support stays on for video scrubbing.
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    etag: false,
    lastModified: false,
    cacheControl: false,
    setHeaders: (res) => res.set('Cache-Control', 'no-store'),
}));

app.use('/api/clients', clientRoutes);
app.use('/api/biens', bienRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/visites', visiteRoutes);
app.use('/api/offres', offreRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/stats',  statsRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/bien-types', bienTypeRoutes);
app.use('/api/contact',   contactRoutes);

app.use(errorMiddleware);

module.exports = app;
