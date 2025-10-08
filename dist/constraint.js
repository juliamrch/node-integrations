import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import CreativeEngine from '@cesdk/node';
// Configuration for the engine
const config = {
    license: process.env.LICENSE_KEY,
    baseURL: 'https://cdn.img.ly/packages/imgly/cesdk-node/1.60.0/assets'
};
CreativeEngine.init(config).then(async (engine) => {
    console.log('CE.SDK Engine initialized');
    try {
        await engine.addDefaultAssetSources();
        await engine.scene.loadFromURL('https://cdn.img.ly/assets/demo/v1/ly.img.template/templates/cesdk_instagram_photo_1.scene');
        const [page] = engine.block.findByType('page');
        const graphics = engine.block.findByType('graphic');
        if (graphics.length === 0) {
            throw new Error('No graphic blocks found to rotate.');
        }
        const rotationStep = Math.PI / 2;
        graphics.forEach((blockId) => {
            const constraintProperty = 'constraints/transform/rotation/step';
            const properties = engine.block.findAllProperties(blockId);
            if (properties.includes(constraintProperty)) {
                engine.block.setEnum(blockId, constraintProperty, '90deg');
            }
            else {
                const currentRotation = engine.block.getFloat(blockId, 'rotation');
                const snappedRotation = Math.round(currentRotation / rotationStep) * rotationStep;
                engine.block.setRotation(blockId, snappedRotation);
                console.warn(`Applied manual rotation snapping for block ${blockId} because ${constraintProperty} is unavailable.`);
            }
        });
        const blob = await engine.block.export(page, { mimeType: 'image/png' });
        const arrayBuffer = await blob.arrayBuffer();
        const outputDir = path.resolve('./assets');
        await fs.mkdir(outputDir, { recursive: true });
        const pattern = /^example-output\((\d+)\)\.png$/;
        const nextIndex = (await fs.readdir(outputDir))
            .map((file) => pattern.exec(file)?.[1])
            .filter(Boolean)
            .map(Number)
            .reduce((max, n) => Math.max(max, n), 0) + 1;
        const outputName = `constraint(${nextIndex}).png`;
        const outputPath = path.join(outputDir, outputName);
        await fs.writeFile(outputPath, Buffer.from(arrayBuffer));
        console.log(`Export completed: ${outputName}`);
    }
    catch (error) {
        console.error('Error processing scene:', error);
    }
    finally {
        engine.dispose();
    }
});
