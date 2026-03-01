interface RGB {
    r: number;
    g: number;
    b: number;
}

type AccentImageSource = HTMLImageElement | HTMLCanvasElement | ImageBitmap | File | Blob | string;

/**
 * Loads an image from a File or Blob into an HTMLImageElement.
 */
function loadImage(source: File | Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(source);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image from File/Blob'));
        };
        img.src = url;
    });
}

function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image from URL: ${url}`));
        img.src = url;
    });
}

/**
 * Identifies the accent (dominant) color of an image using a canvas-based bucketing approach.
 * @param imageSource The image element, File, or Blob to analyze.
 * @param quality Downsampling factor (lower is faster but less accurate).
 */
export async function getAccentColor(
    imageSource: AccentImageSource,
    quality: number = 10
): Promise<RGB> {
    let img: HTMLImageElement | HTMLCanvasElement | ImageBitmap;

    if (typeof imageSource === 'string') {
        img = await loadImageFromUrl(imageSource);
    } else if (imageSource instanceof File || imageSource instanceof Blob) {
        img = await loadImage(imageSource);
    } else {
        img = imageSource;
    }

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
        throw new Error('Could not get canvas context');
    }

    const width = canvas.width =
        img instanceof HTMLImageElement ? (img.naturalWidth || img.width) : img.width;
    const height = canvas.height =
        img instanceof HTMLImageElement ? (img.naturalHeight || img.height) : img.height;

    if (!width || !height) {
        throw new Error('Image source has invalid dimensions');
    }

    context.drawImage(img, 0, 0, width, height);

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

    console.log(`Dominant bucket: ${dominantKey} with count: ${maxCount}`);
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



// usage example: from image file path
// const accent = await getAccentColor('path/to/image.jpg');
// console.log('Accent Hex:', rgbToHex(accent));




