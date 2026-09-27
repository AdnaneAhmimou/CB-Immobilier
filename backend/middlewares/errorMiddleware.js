const { IS_PROD } = require('../config/auth');

// eslint-disable-next-line no-unused-vars -- Express identifies error handlers by arity
module.exports = (err, req, res, next) => {
    console.error(err);

    const status = err.statusCode || 500;

    // Prisma and driver errors carry table names, column names and sometimes the
    // offending values. Client-side (4xx) messages are ours to show; anything else
    // stays in the logs.
    const message = status < 500
        ? err.message
        : (IS_PROD ? 'Erreur interne du serveur' : err.message);

    res.status(status).json({ status: 'error', message });
};
