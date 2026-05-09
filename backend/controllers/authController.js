
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const catchAsync = require('../utils/catchAsync');

const JWT_SECRET = process.env.JWT_SECRET || 'cb-immobilier-secret-key-2026';

exports.register = catchAsync(async (req, res, next) => {
    const { nom, telephone, email, password } = req.body;
    
    const existingAgent = await prisma.agent.findUnique({ where: { email } });
    if (existingAgent) return res.status(400).json({ message: 'Email déjà utilisé.' });

    // Hash avec bcrypt round 10
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newAgent = await prisma.agent.create({
        data: { nom, telephone, email, password: hashedPassword }
    });

    res.status(201).json({ message: 'Agent créé', id: newAgent.id });
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    
    const agent = await prisma.agent.findUnique({ where: { email } });
    if (!agent) return res.status(401).json({ message: 'Identifiants incorrects.' });

    const isValid = await bcrypt.compare(password, agent.password);
    if (!isValid) return res.status(401).json({ message: 'Identifiants incorrects.' });

    const token = jwt.sign({ id: agent.id }, JWT_SECRET, { expiresIn: '1d' });
    
    res.json({ token, agent: { id: agent.id, nom: agent.nom, email: agent.email } });
});
