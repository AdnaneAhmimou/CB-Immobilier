
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const catchAsync = require('../utils/catchAsync');

const JWT_SECRET = process.env.JWT_SECRET || 'cb-immobilier-secret-key-2026';

exports.protect = catchAsync(async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) return res.status(401).json({ message: 'Non autorisé. Token manquant.' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const currentUser = await prisma.agent.findUnique({ where: { id: decoded.id } });

    if (!currentUser) return res.status(401).json({ message: 'Utilisateur introuvable.' });

    req.user = currentUser;
    next();
});
