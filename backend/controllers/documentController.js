const cloudinary = require('../config/cloudinary');
const prisma = require('../config/prisma');
const catchAsync = require('../utils/catchAsync');

function uploadBufferToCloudinary(buffer, originalname) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'cb-immobilier', resource_type: 'auto', filename_override: originalname, use_filename: true },
            (err, result) => err ? reject(err) : resolve(result)
        );
        stream.end(buffer);
    });
}

exports.uploadDocument = catchAsync(async (req, res, next) => {
    if (!req.file) return res.status(400).json({ message: 'Aucun fichier.' });
    const { nom, bienId, clientId } = req.body;

    const [last, uploaded] = await Promise.all([
        prisma.document.findFirst({
            where: { bienId: bienId || null, clientId: clientId || null },
            orderBy: { order: 'desc' },
            select: { order: true },
        }),
        uploadBufferToCloudinary(req.file.buffer, req.file.originalname),
    ]);

    const doc = await prisma.document.create({
        data: {
            nom: nom || req.file.originalname,
            filePath: uploaded.secure_url,
            publicId: uploaded.public_id,
            resourceType: uploaded.resource_type,
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
    if (doc.publicId) {
        await cloudinary.uploader.destroy(doc.publicId, { resource_type: doc.resourceType || 'image' });
    }
    await prisma.document.delete({ where: { id: req.params.id } });
    res.status(204).send();
});
