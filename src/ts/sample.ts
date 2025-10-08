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
    const scene = engine.scene.create();
    const page = engine.block.create('page');
    engine.block.appendChild(scene, page);

    const imageUrl = 'https://img.ly/static/ubq_samples/sample_1.jpg';
    const graphic = engine.block.create('graphic');
    engine.block.setShape(graphic, engine.block.createShape('rect'));

    const imageFill = engine.block.createFill('image');
    engine.block.setFill(graphic, imageFill);
    await engine.block.addImageFileURIToSourceSet(
      imageFill,
      'fill/image/sourceSet',
      imageUrl
    );
    engine.block.setString(imageFill, 'fill/image/imageFileURI', imageUrl);
    engine.block.appendChild(page, graphic);

    const [source] = engine.block.getSourceSet(
      imageFill,
      'fill/image/sourceSet'
    );
    if (!source) {
      throw new Error(`Image metadata not available for ${imageUrl}`);
    }

    engine.block.setSize(graphic, source.width, source.height, {
      sizeMode: 'Absolute'
    });
    engine.block.resetCrop(graphic);

    // Test functions here

    // Download result
    const blob = await engine.block.export(graphic, { mimeType: 'image/png' });
    const outputFilename = `scale-constraints-${Date.now()}.png`;
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
