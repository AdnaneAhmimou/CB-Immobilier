const prisma = require('../config/prisma');
const catchAsync = require('../utils/catchAsync');

exports.getAllBienTypes = catchAsync(async (req, res) => {
    const types = await prisma.bienType.findMany({ orderBy: { label: 'asc' } });
    res.json(types.map(t => t.label));
});

exports.createBienType = catchAsync(async (req, res) => {
    const { label } = req.body;
    if (!label?.trim()) return res.status(400).json({ message: 'Label requis.' });
    const type = await prisma.bienType.upsert({
        where: { label: label.trim() },
        update: {},
        create: { label: label.trim() },
    });
    res.status(201).json(type.label);
});
