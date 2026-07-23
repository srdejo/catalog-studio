// Copia el chromium-headless-shell del caché local de Playwright a
// build/ms-playwright para que electron-builder lo empaquete como
// extraResources (ver electron-builder.yml). Sin esto, el .exe instalado en
// la máquina de un usuario final no encuentra el navegador: Playwright solo
// lo descarga vía el postinstall de `npm install`, que nunca corre ahí.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function defaultBrowsersCacheDir() {
  if (process.env.PLAYWRIGHT_BROWSERS_PATH) return process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (process.platform === 'win32') return path.join(process.env.LOCALAPPDATA ?? '', 'ms-playwright');
  if (process.platform === 'darwin') return path.join(homedir(), 'Library', 'Caches', 'ms-playwright');
  return path.join(homedir(), '.cache', 'ms-playwright');
}

const cacheDir = defaultBrowsersCacheDir();
const targetDir = path.join(__dirname, '..', 'build', 'ms-playwright');

if (!existsSync(cacheDir)) {
  throw new Error(
    `No se encontró el caché de navegadores de Playwright en ${cacheDir}. ` +
      `Corré "npx playwright install chromium-headless-shell" antes de empaquetar.`
  );
}

const headlessShellDirs = readdirSync(cacheDir).filter((name) => name.startsWith('chromium_headless_shell-'));
if (headlessShellDirs.length === 0) {
  throw new Error(
    `No se encontró ninguna carpeta "chromium_headless_shell-*" en ${cacheDir}. ` +
      `Corré "npx playwright install chromium-headless-shell" antes de empaquetar.`
  );
}

// Solo la build más reciente en caché: es la que la versión instalada de
// `playwright` va a pedir. Empaquetar versiones viejas solo infla el .exe.
const versionOf = (name) => Number(name.replace('chromium_headless_shell-', ''));
const latestDir = headlessShellDirs.sort((a, b) => versionOf(b) - versionOf(a))[0];

rmSync(targetDir, { recursive: true, force: true });
mkdirSync(targetDir, { recursive: true });
cpSync(path.join(cacheDir, latestDir), path.join(targetDir, latestDir), { recursive: true });
console.log(`Copiado ${latestDir} -> build/ms-playwright/${latestDir}`);
