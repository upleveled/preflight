import os from 'node:os';
import { execa } from 'execa';
import semver from 'semver';
import { commandExample } from '../util/commandExample.ts';
import { preflightPackageJson } from '../util/packageJson.ts';

export const title = 'Preflight is latest version';

export default async function preflightIsLatestVersion() {
  const { stdout: remoteVersion } =
    await execa`npm show @upleveled/preflight version`;

  if (semver.gt(remoteVersion, preflightPackageJson.version)) {
    throw new Error(
      `Your current version of Preflight (${
        preflightPackageJson.version
      }) is older than the latest version ${remoteVersion} - upgrade with:

        ${commandExample(
          `${
            os.platform() === 'linux' ? 'sudo ' : ''
          }pnpm add --global @upleveled/preflight`,
        )}
      `,
    );
  }
}
