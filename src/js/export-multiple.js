import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import CreativeEngine from '@cesdk/node';

async function run() {
  const engine = await CreativeEngine.init({
    license: process.env.LICENSE_KEY,
    baseURL: process.env.CESDK_BASE_URL
  });

  try {
    // Prepare an image URL
    const images = [
      'https://img.ly/static/ubq_samples/sample_1.jpg',
      'https://img.ly/static/ubq_samples/sample_2.jpg',
      'https://img.ly/static/ubq_samples/sample_3.jpg'
    ];

    // Create an empty scene with a vertical stack layout
    const scene = await engine.scene.create('VerticalStack');
    const [stack] = engine.block.findByType('stack');
    for (const image of images) {
      // Append the new page to the stack
      const page = engine.block.create('page');
      engine.block.appendChild(stack, page);
      // Set the image as the fill of the page
      const imageFill = engine.block.createFill('image');
      engine.block.setString(imageFill, 'fill/image/imageFileURI', image);
      engine.block.setFill(page, imageFill);
    }
    // Export as PDF Blob
    const blob = await engine.block.export(scene, { mimeType: 'application/pdf' });

    const outputFilename = `export-multiple${Date.now()}.pdf`;
    const outputPath = path.resolve('assets', outputFilename);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, Buffer.from(await blob.arrayBuffer()));
    console.log(`Exported scaled image to ${outputPath}`);
  } finally {
    engine.dispose();
  }
}

run().catch((error) => {
  console.error('Scaling demo failed:', error);
});
