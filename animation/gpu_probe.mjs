// Which GPU does headless Chrome's WebGL land on? Prints the unmasked renderer for each flag set.
// node gpu_probe.mjs <chrome path>
import puppeteer from 'puppeteer-core';

const chrome = process.argv[2];
const base = ['--no-sandbox', '--ignore-gpu-blocklist', '--enable-gpu-rasterization'];
const candidates = {
  'angle-vulkan': ['--use-angle=vulkan', '--enable-features=Vulkan'],
  'gl-egl': ['--use-gl=egl'],
  'angle-gl-egl': ['--use-angle=gl-egl'],
  'kit-default': ['--use-gl=angle'],
};
for (const [name, flags] of Object.entries(candidates)) {
  let browser;
  try {
    browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: [...base, ...flags] });
    const page = await browser.newPage();
    const info = await page.evaluate(() => {
      const gl = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl');
      if (!gl) return 'no WebGL context';
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    });
    console.log(`${name.padEnd(13)} ${info}`);
  } catch (e) {
    console.log(`${name.padEnd(13)} FAILED: ${e.message.split('\n')[0]}`);
  } finally {
    await browser?.close();
  }
}
