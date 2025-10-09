import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import CreativeEngine from '@cesdk/node';

async function run() {
  const engine = await CreativeEngine.init({
    license: process.env.LICENSE_KEY,
    baseURL: process.env.CESDK_BASE_URL
  });

  try {
    // Load a template from your server or a CDN
    const sceneUrl = 'https://cdn.img.ly/assets/demo/v2/ly.img.template/templates/cesdk_postcard_2.scene';
    await engine.scene.loadFromURL(sceneUrl);
    // Option 1: Prepare your data as a javascript object
    //const data = {
    //  textVariables: {
    //  first_name: 'John',
    //  last_name: 'Doe',
    //  address: '123 Main St.',
    //  city: 'Anytown',
    //},
  //};
  // Option 2: Load from a local JSON file
  // const data = await fetch('https://api.example.com/design-data').then(res => res.json());
  const dataPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'design-data.json');
  const data = JSON.parse(await fs.readFile(dataPath, 'utf8'));
  engine.variable.setString('first_name', data.textVariables.first_name);
  engine.variable.setString('last_name', data.textVariables.last_name);
  engine.variable.setString('address', data.textVariables.address);
  engine.variable.setString('city', data.textVariables.city);

  const blob = await engine.block.export(engine.scene.get(), {
    mimeType: 'application/pdf',
  });
  // Success: 'output' contains your generated design as a PDF Blob
  // You can now save it or display it in your application

    // Download result
    const outputFilename = `design-automation-${Date.now()}.pdf`;
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
