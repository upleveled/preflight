import { promises as fs } from 'node:fs';
import { createRequire } from 'node:module';
import { execa } from 'execa';
import readdirp from 'readdirp';
import semver from 'semver';
import { supportedStylelintFileExtensions } from './stylelint.ts';

const require = createRequire(`${process.cwd()}/`);

export const title = 'Stylelint config is latest version';

export default async function stylelintConfigIsValid() {
  const { stdout: remoteVersion } =
    await execa`npm show stylelint-config-upleveled version`;

  let localVersion: string | undefined;

  try {
    const stylelintConfigPackageJsonPath = require.resolve(
      'stylelint-config-upleveled/package.json',
    );

    localVersion =
      // Type assertion because we swallow the error anyway if
      // the .version property doesn't exist
      (
        JSON.parse(
          await fs.readFile(stylelintConfigPackageJsonPath, 'utf-8'),
        ) as {
          version: string;
        }
      ).version;
  } catch {
    // Swallow error
  }

  if (typeof localVersion === 'undefined') {
    throw new Error(
      `The UpLeveled Stylelint Config has not been installed - please install using the instructions on https://www.npmjs.com/package/eslint-config-upleveled
      `,
    );
  }

  if (semver.gt(remoteVersion, localVersion)) {
    throw new Error(
      `Your current version of the UpLeveled Stylelint Config (${localVersion}) is older than the latest version ${remoteVersion} - upgrade by running:

      pnpm add stylelint-config-upleveled@${remoteVersion}`,
    );
  }

  let stylelintConfigMatches;

  try {
    stylelintConfigMatches =
      (await fs.readFile('./stylelint.config.js', 'utf-8')).trim() ===
      `/** @type {import('stylelint').Config} */
const config = {
  extends: ['stylelint-config-upleveled'],
};

export default config;`;
  } catch {
    throw new Error(
      `Error reading your stylelint.config.js file - please delete the file if it exists and reinstall the config using the instructions on https://www.npmjs.com/package/eslint-config-upleveled
      `,
    );
  }

  if (!stylelintConfigMatches) {
    throw new Error(
      `Your stylelint.config.js file does not match the configuration file template - please delete the file and reinstall the config using the instructions on https://www.npmjs.com/package/eslint-config-upleveled
      `,
    );
  }

  const stylelintDisableOccurrences = [];

  for await (const { path } of readdirp('.', {
    directoryFilter: (dir) =>
      !['.git', '.next', 'node_modules'].includes(dir.basename),
    fileFilter: (file) =>
      new RegExp(`\\.(?:${supportedStylelintFileExtensions.join('|')})$`).test(
        file.basename,
      ),
  })) {
    const fileContents = await fs.readFile(path, 'utf-8');
    if (fileContents.includes('stylelint-disable')) {
      stylelintDisableOccurrences.push(path);
    }
  }

  if (stylelintDisableOccurrences.length > 0) {
    throw new Error(
      `Stylelint has been disabled in the following files:
        ${stylelintDisableOccurrences.join('\n')}

        Remove all comments disabling or modifying Stylelint rule configuration (eg. stylelint-disable and stylelint-disable-next-line comments) and fix the problems
      `,
    );
  }
}
