import 'dotenv/config';
import http from 'http';
import { chromium } from 'playwright';

const licenseKey = process.env.LICENSE_KEY;
const assetsBaseURL =
  'https://cdn.img.ly/packages/imgly/cesdk-js/1.60.0/assets';
const demoVideoUrl =
  'https://cdn.img.ly/assets/demo/v2/ly.img.video/videos/pexels-drone-footage-of-a-surfer-barrelling-a-wave-12715991.mp4';

async function createServer() {
  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>CE.SDK Playwright Preview</title>
    <style>
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        background: #1e1e1e;
        color: #fff;
        font-family: system-ui, sans-serif;
      }
      #status {
        position: absolute;
        top: 12px;
        left: 12px;
        padding: 6px 10px;
        border-radius: 4px;
        background: rgba(0, 0, 0, 0.55);
        font-size: 13px;
        z-index: 10;
      }
      #cesdk-container {
        width: 100%;
        height: 100%;
      }
    </style>
  </head>
  <body>
    <div id="status">Waiting for CE.SDK…</div>
    <div id="cesdk-container"></div>
  </body>
</html>`;

  return await new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store'
      });
      res.end(html);
    });
    server.once('error', reject);
    server.listen(0, () => {
      const address = server.address();
      if (typeof address === 'object' && address) {
        resolve({ server, url: `http://127.0.0.1:${address.port}/` });
      } else {
        reject(new Error('Unable to determine local server port.'));
      }
    });
  });
}

async function launchCesdk() {
  if (!licenseKey) {
    throw new Error(
      'Missing LICENSE_KEY environment variable. Please set it before running this script.'
    );
  }

  const { server, url } = await createServer();

  const browser = await chromium.launch({ channel: 'chrome', headless: false });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  page.on('console', (msg) => {
    console.log(`[Browser] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });
  page.on('requestfailed', (request) => {
    const failure = request.failure();
    console.log(
      `[Browser] REQUEST FAILED: ${request.method()} ${request.url()} - ${
        failure?.errorText ?? 'unknown error'
      }`
    );
  });
  page.on('response', (response) => {
    if (response.status() >= 400) {
      console.log(
        `[Browser] RESPONSE ${response.status()}: ${response.request().method()} ${response.url()}`
      );
    }
  });

  await page.goto(url, { waitUntil: 'load' });

  await page.evaluate(
    async ({ licenseKey, assetsBaseURL, demoVideoUrl }) => {
      const setStatus = (text) => {
        const statusEl = document.getElementById('status');
        if (statusEl) {
          statusEl.textContent = text;
        }
      };

      setStatus('Loading CE.SDK runtime…');

      try {
        const sdkModule = await import(
          'https://cdn.img.ly/packages/imgly/cesdk-js/1.60.0/index.js'
        );
        const CreativeEditorSDK =
          sdkModule.default ?? sdkModule.CreativeEditorSDK ?? sdkModule;

        setStatus('Initializing editor…');

        const instance = await CreativeEditorSDK.create('#cesdk-container', {
          license: licenseKey,
          baseURL: assetsBaseURL,
          ui: {
            elements: {
              navigation: {
                show: false
              },
              inspector: false,
              libraries: false,
              pages: false
            }
          }
        });

        setStatus('Creating video scene…');
        const scene = instance.engine.scene.createVideo({
          page: { size: { width: 1920, height: 1080 } }
        });

        const pages = instance.engine.scene.getPages();
        const page = pages[0] ?? null;
        if (!page) {
          throw new Error('Failed to create scene page.');
        }

        setStatus('Adding demo video…');
        const videoBlock = await instance.engine.block.addVideo(
          demoVideoUrl,
          1920,
          1080
        );

        const pageWidth = instance.engine.block.getWidth(page);
        const pageHeight = instance.engine.block.getHeight(page);

        await instance.engine.block.forceLoadResources([videoBlock]);
        instance.engine.block.resizeContentAware(
          [videoBlock],
          pageWidth,
          pageHeight
        );

        setStatus('Editor ready.');
        setTimeout(() => {
          document.getElementById('status')?.remove();
        }, 750);
      } catch (error) {
        setStatus(
          `Initialization failed: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
        throw error;
      }
    },
    { licenseKey, assetsBaseURL, demoVideoUrl }
  );

  console.log('Chromium window launched with CE.SDK. Close it to exit.');

  browser.on('disconnected', () => {
    server.close();
  });
}

launchCesdk().catch((error) => {
  console.error('Failed to launch CE.SDK preview with Playwright:', error);
  process.exit(1);
});
