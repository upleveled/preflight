import { sep } from 'node:path';
import { execaCommand } from 'execa';
import { LintResult } from 'stylelint';

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
  try {
    await execaCommand(
      `pnpm stylelint **/*.{${supportedStylelintFileExtensions.join(
        ',',
      )}} --max-warnings 0 --formatter json`,
    );
  } catch (error) {
    const { stdout } = error as { stdout: string };

    let stylelintResults;

    try {
      stylelintResults = JSON.parse(stdout) as LintResult[];
    } catch {
      throw error;
    }

    // If no Stylelint errors detected, throw the error
    if (!stylelintResults.every((result) => 'errored' in result)) {
      throw new Error(
        `Stylelint results are missing 'errorCount' and 'warningCount' properties - please repport the following output to the UpLeveled team:
          ${stdout}
        `,
      );
    }

    throw new Error(
      `Stylelint problems found in the following files:
        ${stylelintResults
          .filter((stylelintResult) => stylelintResult.errored === true)
          // Make paths relative to the project:
          // Before:
          //   macOS / Linux: /home/projects/random-color-generator-react-app/src/index.css
          //   Windows: C:\Users\Lukas\projects\random-color-generator-react-app\src\index.css
          // After: src/index.css
          .map(({ source }) => source!.replace(`${process.cwd()}${sep}`, ''))
          .join('\n')}

        Open these files in your editor - there should be problems to fix
      `,
    );
  }
}
