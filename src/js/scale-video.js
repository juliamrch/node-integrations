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

    const videoUrl = 'https://cdn.img.ly/assets/demo/v2/ly.img.video/videos/pexels-drone-footage-of-a-surfer-barrelling-a-wave-12715991.mp4';
    const graphic = engine.block.create('graphic');
    engine.block.setShape(graphic, engine.block.createShape('rect'));

    const videoFill = engine.block.createFill('video');
    engine.block.setFill(graphic, videoFill);
    await engine.block.addVideoFileURIToSourceSet(
      videoFill,
      'fill/video/sourceSet',
      videoUrl
    );
    engine.block.setString(videoFill, 'fill/video/fileURI', videoUrl);
    engine.block.appendChild(page, graphic);

    const [source] = engine.block.getSourceSet(
      videoFill,
      'fill/video/sourceSet'
    );
    if (!source) {
      throw new Error(`Video metadata not available for ${videoUrl}`);
    }

    engine.block.setSize(graphic, source.width, source.height, {
      sizeMode: 'Absolute'
    });
    engine.block.resetCrop(graphic);

   

    // Download result
    const outputDir = path.resolve('assets');
    await fs.mkdir(outputDir, { recursive: true });
    const timestamp = Date.now();
    const videoFilename = `scale-video-${timestamp}.mp4`;
    const videoPath = path.join(outputDir, videoFilename);

    try {
      const videoBlob = await engine.block.exportVideo(page, {
        mimeType: 'video/mp4'
      });
      await fs.writeFile(videoPath, Buffer.from(await videoBlob.arrayBuffer()));
      console.log(`Exported scaled video to ${videoPath}`);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('not supported on Node.JS')
      ) {
        console.warn(
          'Video export is not supported in Node. Exporting first frame as PNG instead.'
        );
        const imageBlob = await engine.block.export(page, {
          mimeType: 'image/png'
        });
        const imagePath = path.join(outputDir, `scale-video-${timestamp}.png`);
        await fs.writeFile(
          imagePath,
          Buffer.from(await imageBlob.arrayBuffer())
        );
        console.log(`Exported fallback image to ${imagePath}`);
      } else {
        throw error;
      }
    }
  } finally {
    engine.dispose();
  }
}

run().catch((error) => {
  console.error('Scaling demo failed:', error);
});
