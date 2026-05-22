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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
