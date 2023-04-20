import { execaCommand } from 'execa';
import { LintResult } from 'stylelint';
import { projectPackageJson } from '../util/packageJson';

const projectDependencies = projectPackageJson.dependencies || {};

export const supportedStylelintFileExtensions = [
  'css',
  'sass',
  'scss',
  'less',
  'js',
  'tsx',
  'jsx',
];

export const title = 'Stylelint';

export default async function stylelintCheck() {
  // Continue only if project is Next.js or UpLeveled React App
  if (
    !(
      '@upleveled/react-scripts' in projectDependencies ||
      'next' in projectDependencies
    )
  ) {
    return;
  }

  try {
    await execaCommand(
      `yarn stylelint **/*.{${supportedStylelintFileExtensions.join(
        ',',
      )}} --max-warnings 0 --formatter json`,
    );
  } catch (error) {
    const { stdout } = error as { stdout: string };

    const stylelintJSONOutput = stdout.slice(
      stdout.indexOf('['),
      stdout.lastIndexOf(']') + 1,
    );

    // If no Stylelint errors detected, throw the error
    if (!/"errored":/.test(stylelintJSONOutput)) {
      throw error;
    }

    const stylelintResultsWithErrors = (
      JSON.parse(stylelintJSONOutput) as LintResult[]
    ).filter((stylelintResult) => stylelintResult.errored === true);

    if (stylelintResultsWithErrors.length > 0) {
      throw new Error(
        `Stylelint problems found in the following files:
          ${stylelintResultsWithErrors
            .map((stylelintResult) => stylelintResult.source)
            .join('\n')}

          Open these files in your editor - there should be problems to fix
        `,
      );
    }
  }
}
