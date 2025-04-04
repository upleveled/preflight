import { execa } from 'execa';
import { commandExample } from '../../util/commandExample.ts';
import { preflightBinPath } from '../../util/preflightBinPath.ts';

export const title = 'No unused dependencies';

export default async function noUnusedAndMissingDependencies() {
  const ignoredPackagePatterns = [
    // Unused dependency detected in https://github.com/upleveled/next-portfolio-dev
    '@graphql-codegen/cli',

    // Tailwind CSS
    '@tailwindcss/jit',
    '@tailwindcss/postcss',
    'autoprefixer',
    'postcss',
    'tailwindcss',

    // Sass (eg. in Next.js)
    'sass',

    // Prettier and plugins
    'prettier',
    'prettier-plugin-*',

    // ESLint configuration
    '@ts-safeql/eslint-plugin',
    'libpg-query',

    // TODO: Remove this once depcheck issue is fixed:
    // - PR: https://github.com/depcheck/depcheck/pull/790
    // - Issue: https://github.com/depcheck/depcheck/issues/791
    //
    // Stylelint configuration
    'stylelint',
    'stylelint-config-upleveled',

    // Testing
    '@testing-library/user-event',
    'jest',
    'jest-environment-jsdom',
    'playwright',

    // `expect` required for proper types with `@testing-library/jest-dom` with `@jest/globals` and pnpm
    // - https://github.com/testing-library/jest-dom/issues/123#issuecomment-1536828385
    // TODO: Remove when we switch from Jest to Vitest
    'expect',

    // `esbuild-register` required for jest.config.ts
    // - https://jestjs.io/docs/next/configuration#:~:text=To%20read%20TypeScript%20configuration%20files%20Jest%20by%20default%20requires%20ts%2Dnode.%20You%20can%20override%20this%20behavior%20by%20adding%20a%20%40jest%2Dconfig%2Dloader%20docblock%20at%20the%20top%20of%20the%20file.%20Currently%2C%20ts%2Dnode%20and%20esbuild%2Dregister%20is%20supported.
    // TODO: Remove when usage of tsx is allowed
    // - https://github.com/jestjs/jest/issues/11989
    'esbuild-register',

    // TypeScript
    'typescript',
    '@types/*',
    'tsx',

    // Next.js
    'sharp',

    // Expo
    '@babel/core',
    'expo-build-properties',
    'expo-dev-client',
    'expo-splash-screen',
    'expo-system-ui',
    'react-dom',
    'react-native-gesture-handler',
  ].join(',');

  try {
    await execa`${preflightBinPath}/depcheck --ignores="${ignoredPackagePatterns}"`;
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

        ${commandExample('pnpm remove <dependency name here>')}
      `);
    }

    if (missingDependenciesStdout) {
      messages.push(`Missing dependencies found:
        ${missingDependenciesStdout
          .split('\n')
          .filter((str: string) => str.includes('* '))
          .join('\n')}

        Add these missing dependencies by running the following command for each dependency:

        ${commandExample('pnpm add <dependency name here>')}
      `);
    }

    if (messages.length > 0) throw new Error(messages.join('\n\n'));
  }
}
