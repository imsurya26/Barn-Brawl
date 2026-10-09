import {defineConfig} from '@playwright/test';

const browserPort = Number(process.env.BROWSER_TEST_PORT ?? 3102);
const browserBaseURL = `http://127.0.0.1:${browserPort}`;

export default defineConfig({
  testDir: './tests/browser',
  timeout: 180000,
  workers: 1,
  webServer: {
    command: 'npm start',
    url: `${browserBaseURL}/health`,
    env: { HOST: '127.0.0.1', PORT: String(browserPort), MATCH_SECONDS: '30' },
    reuseExistingServer: false,
  },
  use: {
    baseURL: browserBaseURL,
    viewport: { width: 1280, height: 720 },
    launchOptions: { args: ['--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
    screenshot: 'only-on-failure',
  },
  reporter: 'list',
});
