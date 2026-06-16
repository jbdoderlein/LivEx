import { copyFile } from 'node:fs/promises';

await copyFile(new URL('../out/index.d.ts', import.meta.url), new URL('../out/index.d.cts', import.meta.url));
await copyFile(new URL('../out/index.d.ts.map', import.meta.url), new URL('../out/index.d.cts.map', import.meta.url));
