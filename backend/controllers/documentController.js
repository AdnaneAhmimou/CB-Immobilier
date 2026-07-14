const fs = require('fs');
const path = require('path');
const prisma = require('../config/prisma');
const catchAsync = require('../utils/catchAsync');

exports.uploadDocument = catchAsync(async (req, res, next) => {
    if (!req.file) return res.status(400).json({ message: 'Aucun fichier.' });
    const { nom, bienId, clientId } = req.body;

    const last = await prisma.document.findFirst({
        where: { bienId: bienId || null, clientId: clientId || null },
        orderBy: { order: 'desc' },
        select: { order: true },
    });

    const doc = await prisma.document.create({
        data: {
            nom: nom || req.file.originalname,
            filePath: '/uploads/' + req.file.filename,
            order: (last?.order ?? -1) + 1,
            bienId: bienId || null,
            clientId: clientId || null
        }
    });
    res.status(201).json(doc);
});

exports.reorderDocuments = catchAsync(async (req, res, next) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: 'ids doit être un tableau non vide.' });
    }
    await prisma.$transaction(
        ids.map((id, index) => prisma.document.update({ where: { id }, data: { order: index } }))
    );
    res.status(204).send();
});

exports.getAllDocuments = catchAsync(async (req, res, next) => {
    const docs = await prisma.document.findMany({
        include: { bien: true, client: true },
        orderBy: { createdAt: 'desc' },
    });
    res.json(docs);
});

exports.deleteDocument = catchAsync(async (req, res, next) => {
    const doc = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (!doc) return res.status(404).json({ message: 'Document introuvable.' });
    const fullPath = path.join(__dirname, '..', doc.filePath);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    await prisma.document.delete({ where: { id: req.params.id } });
    res.status(204).send();
});
