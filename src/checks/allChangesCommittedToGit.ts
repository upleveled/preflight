import { promises as fs } from 'node:fs';
import { execa } from 'execa';
import { commandExample } from '../util/commandExample.ts';
import { isDrone } from '../util/drone.ts';

export const title = 'All changes committed to Git';

export default async function allChangesCommittedToGit() {
  const { stdout: replSlug } = await execa`echo $REPL_SLUG`;

  const isRunningInReplIt = replSlug !== '';

  if (isRunningInReplIt) {
    await fs.writeFile('.git/info/exclude', '.replit\n');
  }

  const { stdout } = await execa`git status --porcelain`;

  if (stdout !== '') {
    const onlyPnpmLockModifiedOnDrone =
      stdout.trim() === 'M pnpm-lock.yaml' && (await isDrone());
    throw new Error(
      `Some changes have not been committed to Git:
        ${stdout}${
          onlyPnpmLockModifiedOnDrone
            ? `

        The only file with changes is the pnpm-lock.yaml file, indicating that npm was incorrectly used in addition to pnpm (eg. an "npm install" command was run). To fix this, force regeneration of the pnpm-lock.yaml file locally with the following command and then commit the changes:

        ${commandExample('pnpm install --force')}`
            : ''
        }
      `,
    );
  }
}
