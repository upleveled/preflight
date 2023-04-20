import { execaCommand } from 'execa';
import { LintResult } from 'stylelint';

export const supportedExtensions = ['css', 'scss', 'less', 'js', 'tsx', 'jsx'];

export const title = 'Stylelint';

export default async function stylelintCheck() {
  try {
    await execaCommand(
      `yarn stylelint **/*.{${supportedExtensions.join()}} --max-warnings 0 --formatter json`,
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
      JSON.parse(stylelintJSONOutput) as LintResult[]
    ).filter((stylelintError) => stylelintError.errored);

    if (stylelintErrors.length > 0) {
      throw new Error(
        `Stylelint problems found in the following files:
        ${stylelintErrors.map((stylelintError) => stylelintError.source)}

          Open these files in your editor - there should be problems to fix
        `,
      );
    }
  }
}
