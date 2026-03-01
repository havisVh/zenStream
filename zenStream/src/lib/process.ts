import { extractColors ,extractDominantColor } from '@ltcode/color-extractor';

async function processImage(imagePath: string) {
  try {
    const clr = await extractDominantColor(imagePath, { format: 'hex', ignoreDarkColors: false,ignoreLightColors: false }); 
    const clrs = await extractColors (imagePath, { format: 'hex', ignoreDarkColors: false,ignoreLightColors: true, paletteSize: 5 });
    return {
        accentColor : clr,
        palette : clrs
    };

  } catch (error) {
    console.error("Error processing image:", error);
  }
}

function setCSSVariables(variable,value) {
    const root = document.documentElement;
    root.style.setProperty(variable, value);
}

export { processImage , setCSSVariables};


