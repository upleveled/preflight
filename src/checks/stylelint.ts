import { execaCommand } from 'execa';
import { StylelintErrors } from '../types/stylelint';

export const title = 'Stylelint';

export default async function stylelintCheck() {
  try {
    await execaCommand(
      'yarn stylelint **/*.{css,scss,less,js,tsx} --max-warnings 0 --formatter json',
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

    const stylelintErrors = (
      JSON.parse(stylelintJSONOutput) as StylelintErrors
    ).filter((stylelintError) => stylelintError.errored);

    if (stylelintErrors.length > 0) {
      throw new Error(
        `Stylelint problems found in the following files:
        ${stylelintErrors.map(
          (stylelintError: { source: string }) => stylelintError.source,
        )}

          Open these files in your editor - there should be problems to fix
        `,
      );
    }
  }
}
