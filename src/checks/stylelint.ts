import { sep } from 'node:path';
import { execa } from 'execa';
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
    await execa({
      // Execute binaries in ./node_modules/.bin to avoid pnpm overhead
      // https://github.com/sindresorhus/execa/blob/main/docs/environment.md#local-binaries
      preferLocal: true,
    })`stylelint **/*.{${supportedStylelintFileExtensions.join(
      ',',
    )}} --max-warnings 0 --formatter json`;
  } catch (error) {
    const { stderr } = error as { stderr: string };

    let stylelintResults;

    try {
      stylelintResults = (JSON.parse(stderr) as LintResult[]).filter(
        (stylelintResult) => stylelintResult.errored === true,
      );
    } catch {
      throw new Error(
        `Failed to parse Stylelint JSON output - please report this to the UpLeveled engineering team, including the following output:

          ${stderr}
        `,
      );
    }

    if (
      stylelintResults.length < 1 ||
      !stylelintResults.every((result) => 'errored' in result)
    ) {
      throw new Error(
        `Unexpected shape of Stylelint JSON related to .errored properties - please report this to the UpLeveled engineering team, including the following output:
          ${stderr}
        `,
      );
    }

    throw new Error(
      `Stylelint problems found in the following files:
        ${stylelintResults
          // Make paths relative to the project:
          //
          // Before:
          //   macOS / Linux: /home/projects/random-color-generator-react-app/src/index.css
          //   Windows: C:\Users\Lukas\projects\random-color-generator-react-app\src\index.css
          //
          // After:
          //   macOS / Linux: src/index.css
          //   Windows: src\index.css
          .map(({ source }) => source!.replace(`${process.cwd()}${sep}`, ''))
          .join('\n')}

        Open these files in your editor - there should be problems to fix
      `,
    );
  }
}
