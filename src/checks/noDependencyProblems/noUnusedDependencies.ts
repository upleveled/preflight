import { execaCommand } from 'execa';
import commandExample from '../../util/commandExample';
import preflightBinPath from '../../util/preflightBinPath';

export const title = 'No unused dependencies';

export default async function noUnusedAndMissingDependencies() {
  const ignoredPackagePatterns = [
    // Unused dependency detected in https://github.com/upleveled/next-portfolio-dev
    '@graphql-codegen/cli',

    // Unused dependency detected in create-react-app
    '@testing-library/user-event',

    // Tailwind CSS
    '@tailwindcss/jit',
    'autoprefixer',
    'postcss',
    'tailwindcss',

    // Sass (eg. in create-react-app)
    'sass',

    // ESLint configuration
    'babel-eslint',
    'eslint-config-next',

    // Testing
    'babel-jest',
    'cypress',
    'jest',
    'jest-environment-jsdom',
    'jest-puppeteer',
    'playwright',
    'puppeteer',

    // TypeScript
    'typescript',
    '@types/*',

    // Next.js
    'sharp',
  ].join(',');

  try {
    await execaCommand(
      `${preflightBinPath}/depcheck --ignores="${ignoredPackagePatterns}"`,
    );
  } catch (error) {
    const { stdout } = error as { stdout: string };
    if (
      !stdout.startsWith('Unused dependencies') &&
      !stdout.startsWith('Unused devDependencies') &&
      !stdout.startsWith('Missing dependencies')
    ) {
      throw error;
    }

    const [unusedDependenciesStdout, missingDependenciesStdout] = stdout.split(
      'Missing dependencies',
    );

    const messages = [];

    if (unusedDependenciesStdout) {
      messages.push(`Unused dependencies found:
        ${unusedDependenciesStdout
          .split('\n')
          .filter((str: string) => str.includes('* '))
          .join('\n')}

        Remove these dependencies by running the following command for each dependency:

        ${commandExample('yarn remove <dependency name here>')}
      `);
    }

    /**
     * Filter out @upleveled/eslint-config-upleveled peer dependencies not listed in package.json and flagged as missing dependencies by depcheck
     * TODO: Remove the filter once the issue 789 is fixed in depcheck
     * https://github.com/depcheck/depcheck/issues/789
     */
    const missingDependenciesStdoutFiltered = missingDependenciesStdout
      .split('\n')
      .filter(
        (missingDependency) =>
          !(
            missingDependency.includes('./.eslintrc.cjs') &&
            [
              '@typescript-eslint/parser',
              '@next/eslint-plugin-next',
              '@typescript-eslint/eslint-plugin',
              '@upleveled/eslint-plugin-upleveled',
              'eslint-plugin-import',
              'eslint-plugin-jsx-a11y',
              'eslint-plugin-jsx-expressions',
              'eslint-plugin-react',
              'eslint-plugin-react-hooks',
              'eslint-plugin-security',
              'eslint-plugin-sonarjs',
              'eslint-plugin-unicorn',
              'eslint-config-react-app',
              'eslint-import-resolver-typescript',
            ].some((excludedDependency) =>
              missingDependency.includes(excludedDependency),
            )
          ),
      )
      .join('\n');

    if (missingDependenciesStdoutFiltered) {
      messages.push(`Missing dependencies found:
        ${missingDependenciesStdoutFiltered
          .split('\n')
          .filter((str: string) => str.includes('* '))
          .join('\n')}

        Add these missing dependencies by running the following command for each dependency:

        ${commandExample('yarn add <dependency name here>')}
      `);
    }

    if (messages.length > 0) throw new Error(messages.join('\n\n'));
  }
}
