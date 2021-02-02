import execa from 'execa';
import { promises as fs } from 'fs';
import semver from 'semver';
import commandExample from '../commandExample';

export const title = 'ESLint config is latest version';

export default async function eslintConfigIsLatestVersion() {
  const { stdout: remoteVersion } = await execa.command(
    'npm show @upleveled/eslint-config-upleveled version',
  );

  const localVersion = JSON.parse(await fs.readFile('./package.json', 'utf-8'))
    .devDependencies?.['@upleveled/eslint-config-upleveled'];

  if (typeof localVersion === 'undefined') {
    throw new Error(
      `The UpLeveled ESLint config has not been installed. Please install using the instructions on https://www.npmjs.com/package/@upleveled/eslint-config-upleveled
      `,
    );
  }

  if (semver.gt(remoteVersion, localVersion)) {
    throw new Error(
      `Your current version of the UpLeveled ESLint config (${localVersion}) is out of date. The latest version is ${remoteVersion}. Upgrade with:

        ${commandExample(
          'yarn upgrade --latest @upleveled/eslint-config-upleveled',
        )}
      `,
    );
  }
}
