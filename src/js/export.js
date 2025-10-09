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
    const imageURL = 'https://img.ly/static/ubq_samples/sample_1.jpg';

    // Create a new scene by loading the image immediately
    await engine.scene.createFromImage(imageURL, 72);

    // Find the automatically added graphic block with an image fill
    const block = engine.block.findByType('page')[0];

    // Apply crop with a scale ratio of 2.0
    engine.block.setCropScaleRatio(block, 2.0);

    // Export as PDF Blob
    const page = engine.scene.getCurrentPage();
    // Set spot color to be used as underlayer
    engine.editor.setSpotColorRGB('RDG_WHITE', 0.8, 0.8, 0.8);

    const blob = await engine.block.export(page, { mimeType: 'application/pdf',
      targetWidth: 800,
      targetHeight: 600,
      exportPdfWithHighCompatibility: true,
      exportPdfWithUnderlayer: true,
      underlayerSpotColorName: 'RDG_WHITE',
      underlayerOffset: -2.0,
     });
    // You can now save it or display it in your application
    //const scene = engine.scene.create();
    //const page = engine.block.create('page');
    //engine.block.appendChild(scene, page);

    //const imageUrl = 'https://img.ly/static/ubq_samples/sample_1.jpg';
    //const graphic = engine.block.create('graphic');
    //engine.block.setShape(graphic, engine.block.createShape('rect'));

    //const imageFill = engine.block.createFill('image');
    //engine.block.setFill(graphic, imageFill);
    //await engine.block.addImageFileURIToSourceSet(
      //imageFill,
      //'fill/image/sourceSet',
      //imageUrl
    //);
    //engine.block.setString(imageFill, 'fill/image/imageFileURI', imageUrl);
    //engine.block.appendChild(page, graphic);

    //const [source] = engine.block.getSourceSet(
      //imageFill,
      //'fill/image/sourceSet'
    //);
    //if (!source) {
      //throw new Error(`Image metadata not available for ${imageUrl}`);
    //}

    //engine.block.setSize(graphic, source.width, source.height, {
      //sizeMode: 'Absolute'
    //});
    //engine.block.resetCrop(graphic);

    // Test functions here


    // Download result
    //const blob = await engine.block.export(graphic, { mimeType: 'image/png' });
    const outputFilename = `export-${Date.now()}.pdf`;
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
