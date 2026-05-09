require('dotenv').config();
const app = require('./app');
const PORT = process.env.PORT || 3000;

process.on('uncaughtException', (err) => {
    console.error('Erreur critique :', err.message);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    console.error('Promesse rejetée :', err.message);
    process.exit(1);
});

app.listen(PORT, () => {
    console.log(`Serveur CB-Immobilier démarré sur le port ${PORT}`);
});
