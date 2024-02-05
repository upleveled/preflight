import { execaCommand } from 'execa';
import { normalizeNewlines } from '../util/crossPlatform';

export const title = 'Prettier';

export default async function prettierCheck() {
  try {
    await execaCommand('pnpm prettier . --list-different --end-of-line auto');
  } catch (error) {
    const { stdout, stderr } = error as { stdout: string; stderr: string };

    const stderrWithoutPackageJsonWarning = stderr.replace(
      /warning [/.\\]*package\.json: No license field[\r\n]*/g,
      '',
    );

    if (!stdout || stderrWithoutPackageJsonWarning) {
      throw error;
    }

    const unformattedFiles = normalizeNewlines(stdout).split('\n');

    if (unformattedFiles.length > 0) {
      throw new Error(
        `Prettier has not been run in the following files:
          ${unformattedFiles.join('\n')}

          For each of the files above, open the file in your editor and save the file. This will format the file with Prettier, which will cause changes to appear in Git.
        `,
      );
    }
  }
}
