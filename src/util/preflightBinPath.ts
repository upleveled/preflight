import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execa } from 'execa';

export const { stdout: preflightBinPath } = await execa({
  cwd: dirname(fileURLToPath(import.meta.url)),
})`pnpm bin`;
