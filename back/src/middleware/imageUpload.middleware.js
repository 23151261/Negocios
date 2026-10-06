const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const imageTypes = {
    'image/jpeg': { extension: '.jpg', signature: buffer => buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff },
    'image/png': { extension: '.png', signature: buffer => buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
    'image/webp': { extension: '.webp', signature: buffer => buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP' }
};

function createImageUpload(folder) {
    const destination = path.join(__dirname, '..', '..', 'uploads', folder);
    const parser = multer({
        storage: multer.diskStorage({
            destination: (req, file, callback) => {
                fs.mkdir(destination, { recursive: true }, error => callback(error, destination));
            },
            filename: (req, file, callback) => {
                callback(null, `${crypto.randomUUID()}${imageTypes[file.mimetype].extension}`);
            }
        }),
        limits: { fileSize: 2 * 1024 * 1024, files: 1 },
        fileFilter: (req, file, callback) => {
            if (!imageTypes[file.mimetype]) {
                callback(new Error('La imagen debe ser JPG, PNG o WEBP.'));
                return;
            }
            callback(null, true);
        }
    }).single('image');

    return (req, res, next) => {
        parser(req, res, async error => {
            if (error) {
                const status = error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
                res.status(status).json({
                    error: error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE'
                        ? 'La imagen no puede superar 2 MB.'
                        : error.message
                });
                return;
            }
            if (!req.file) {
                next();
                return;
            }

            try {
                const file = await fs.promises.readFile(req.file.path);
                if (!imageTypes[req.file.mimetype].signature(file)) {
                    await fs.promises.unlink(req.file.path);
                    res.status(400).json({ error: 'El archivo no contiene una imagen JPG, PNG o WEBP válida.' });
                    return;
                }
                next();
            } catch (validationError) {
                next(validationError);
            }
        });
    };
}

module.exports = {
    productImageUpload: createImageUpload('productos'),
    clientImageUpload: createImageUpload('clientes')
};
