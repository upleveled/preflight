import { execaCommand } from 'execa';
import { LintResult } from 'stylelint';

const errorKey = 'errored' as const;

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

    // If no Stylelint errors detected, throw the error
    if (!new RegExp(`"${errorKey}":`).test(stdout)) {
      throw error;
    }

    throw new Error(
      `Stylelint problems found in the following files:
        ${(JSON.parse(stdout) as LintResult[])
          .filter((stylelintResult) => stylelintResult[errorKey] === true)
          // Make paths relative to the project:
          // before: /home/projects/random-color-generator-react-app/src/index.css
          // after: src/index.css
          .map(({ source }) => source!.replace(process.cwd(), '').slice(1))
          .join('\n')}

        Open these files in your editor - there should be problems to fix
      `,
    );
  }
}
