import { writeFile } from 'node:fs/promises';
import { disposeCreativeEngine, getCreativeEngine } from './creativeEngineHelper.js';

async function buildGreeting() {
  const engine = await getCreativeEngine();

  try {
    await engine.addDefaultAssetSources();

    const scene = engine.scene.create();
    const page = engine.block.create('page');
    engine.block.setWidth(page, 800);
    engine.block.setHeight(page, 600);
    engine.block.appendChild(scene, page);

    const imageBlock = engine.block.create('graphic');
    engine.block.setShape(imageBlock, engine.block.createShape('rect'));
    const imageFill = engine.block.createFill('image');
    engine.block.setString(
      imageFill,
      'fill/image/imageFileURI',
      'https://img.ly/static/ubq_samples/sample_1.jpg'
    );
    engine.block.setFill(imageBlock, imageFill);
    engine.block.setPosition(imageBlock, 100, 100);
    engine.block.setWidth(imageBlock, 300);
    engine.block.setHeight(imageBlock, 300);
    engine.block.appendChild(page, imageBlock);

    const textBlock = engine.block.create('text');
    engine.block.setString(textBlock, 'text/text', 'Hello from Headless Mode!');
    engine.block.setPosition(textBlock, 100, 450);
    engine.block.setWidth(textBlock, 600);
    engine.block.appendChild(page, textBlock);

    const exportResult = await engine.block.export(page, { mimeType: 'image/png' });
    const arrayBuffer = await exportResult.arrayBuffer();

    await writeFile('headless-output.png', Buffer.from(arrayBuffer));
    console.log('Export complete: headless-output.png');
  } catch (error) {
    console.error('Failed to export headless scene', error);
  } finally {
    await disposeCreativeEngine();
  }
}

buildGreeting().catch((error) => {
  console.error('Unexpected failure', error);
  process.exitCode = 1;
});
