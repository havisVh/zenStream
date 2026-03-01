interface RGB {
    r: number;
    g: number;
    b: number;
}

/**
 * Identifies the accent (dominant) color of an image using a canvas-based bucketing approach.
 * @param imageElement The image element to analyze.
 * @param quality Downsampling factor (lower is faster but less accurate).
 */
export function getAccentColor(imageElement: HTMLImageElement, quality: number = 10): RGB {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
        throw new Error('Could not get canvas context');
    }

    // Resize image to a smaller scale to speed up processing
    const width = canvas.width = imageElement.naturalWidth || imageElement.width;
    const height = canvas.height = imageElement.naturalHeight || imageElement.height;

    context.drawImage(imageElement, 0, 0, width, height);

    const imageData = context.getImageData(0, 0, width, height).data;
    const pixelCount = width * height;
    const colorMap: Map<string, number> = new Map();

    // Iterate through pixels and bucket them
    for (let i = 0; i < pixelCount; i += quality * 4) {
        const r = imageData[i];
        const g = imageData[i + 1];
        const b = imageData[i + 2];
        const a = imageData[i + 3];

        // Skip transparent pixels
        if (a < 125) continue;

        // Bucket colors by reducing precision (bit shifting)
        // This groups similar colors together, acting as a simple quantization
        const bucketR = r >> 4;
        const bucketG = g >> 4;
        const bucketB = b >> 4;
        const key = `${bucketR},${bucketG},${bucketB}`;

        colorMap.set(key, (colorMap.get(key) || 0) + 1);
    }

    // Find the most frequent bucket
    let maxCount = 0;
    let dominantKey = '0,0,0';

    colorMap.forEach((count, key) => {
        if (count > maxCount) {
            maxCount = count;
            dominantKey = key;
        }
    });

    const [dr, dg, db] = dominantKey.split(',').map(v => parseInt(v) << 4);

    return { r: dr, g: dg, b: db };
}

/**
 * Converts RGB values to a hex string.
 */
export function rgbToHex(rgb: RGB): string {
    const componentToHex = (c: number) => {
        const hex = c.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return '#' + componentToHex(rgb.r) + componentToHex(rgb.g) + componentToHex(rgb.b);
}

// Example usage:
// const img = document.querySelector('img');
// const accent = getAccentColor(img);
// console.log('Accent Hex:', rgbToHex(accent));
