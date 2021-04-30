import { fileURLToPath } from 'node:url';
import execa from 'execa';
import { dirname } from 'path';

const { stdout: preflightBinPath } = await execa.command(`yarn bin`, {
  cwd: dirname(fileURLToPath(import.meta.url)),
});

export default preflightBinPath;
