import 'dotenv/config';
import CreativeEngine from '@cesdk/node';

const defaultConfig = {
  license: process.env.LICENSE_KEY
  //baseURL:
    //process.env.CESDK_BASE_URL ??
    //process.env.CESDK_ASSET_BASE_URL ??
    //'https://cdn.img.ly/packages/imgly/cesdk-node/1.60.0/assets'
};

// Memoized initialization promise so initialization happens at most once at a time.
let enginePromise;

export async function getCreativeEngine(config = defaultConfig) {
  if (!enginePromise) {
    enginePromise = CreativeEngine.init(config).catch((error) => {
      enginePromise = undefined;
      throw error;
    });
  }

  return enginePromise;
}

export async function disposeCreativeEngine() {
  if (!enginePromise) {
    return;
  }

  const engine = await enginePromise;
  enginePromise = undefined;
  engine.dispose();
}

export function getCreativeEngineConfig() {
  return defaultConfig;
}
