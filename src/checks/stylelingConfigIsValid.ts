import { promises as fs } from 'node:fs';
import { createRequire } from 'node:module';
import { execaCommand } from 'execa';
import readdirp from 'readdirp';
import semver from 'semver';

const require = createRequire(`${process.cwd()}/`);

export const title = 'Stylelint config is latest version';

export default async function stylelintConfigIsValid() {
  const { stdout: remoteVersion } = await execaCommand(
    'npm show stylelint-config-upleveled version',
  );

  let localVersion;

  try {
    const stylelintConfigPackageJsonPath = require.resolve(
      'stylelint-config-upleveled/package.json',
    );

    localVersion = JSON.parse(
      await fs.readFile(stylelintConfigPackageJsonPath, 'utf-8'),
    ).version;
  } catch (err) {}

  if (typeof localVersion === 'undefined') {
    throw new Error(
      `The UpLeveled Stylelint config has not been installed. Please install using the instructions on https://www.npmjs.com/package/eslint-config-upleveled
      `,
    );
  }

  if (semver.gt(remoteVersion, localVersion)) {
    throw new Error(
      `Your current version of the UpLeveled styleLint config (${localVersion}) is out of date. The latest version is ${remoteVersion}. Upgrade by running:

      pnpm install stylelint-config-upleveled@${remoteVersion}`,
    );
  }

  let stylelintConfigMatches;

  try {
    stylelintConfigMatches =
      (await fs.readFile('./stylelint.config.cjs', 'utf-8')).trim() ===
      `/** @type { import('stylelint').Config } */
const config = {
  extends: ['stylelint-config-upleveled'],
};

module.exports = config;`;
  } catch (err) {
    throw new Error(
      `Error reading your stylelint.config.cjs file. Please reinstall the config using the instructions on https://www.npmjs.com/package/eslint-config-upleveled
      `,
    );
  }

  if (!stylelintConfigMatches) {
    throw new Error(
      `Your Stylelint config file stylelint.config.cjs does not match the configuration file template. Please reinstall the config using the instructions on https://www.npmjs.com/package/eslint-config-upleveled
      `,
    );
  }

  const stylelintDisableOccurrences = [];

  for await (const { path } of readdirp('.', {
    directoryFilter: ['!.git', '!.next', '!node_modules'],
    fileFilter: ['*.css', '*.scss', '*.sass'],
  })) {
    const fileContents = await fs.readFile(path, 'utf-8');
    if (
      /stylelint-disable|stylelint [a-z0-9@/-]+: (0|off)/.test(fileContents)
    ) {
      stylelintDisableOccurrences.push(path);
    }
  }

  if (stylelintDisableOccurrences.length > 0) {
    throw new Error(
      `Stylelint has been disabled in the following files:
        ${stylelintDisableOccurrences.join('\n')}

        Remove all comments disabling or modifying Stylelint rule configuration (eg. stylelint-disable and stylelint-disable-next-line comments) and fix the problems.
      `,
    );
  }
}
