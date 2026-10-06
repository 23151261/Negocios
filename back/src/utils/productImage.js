const legacyProductImages = new Map([
    ['pizza margarita', '/pizza.jpg'],
    ['pizza pepperoni', '/pepperoni.jpg'],
    ['hamburguesa clasica', '/clasica.jpg'],
    ['hamburguesa bbq', '/bbq.jpg'],
    ['salmon a la plancha', '/salmon.jpg'],
    ['ceviche de camaron', '/ceviche.jpg'],
    ['cafe de especialidad', '/cafe.jpg'],
    ['ensalada cesar', '/cesar.jpg']
]);

function getProductImage(image, name) {
    if (typeof image === 'string' && image.trim()) return image.trim();
    const normalizedName = String(name || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
    return legacyProductImages.get(normalizedName) || '';
}

module.exports = getProductImage;
