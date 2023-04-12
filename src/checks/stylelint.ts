import { execaCommand } from 'execa';

export const title = 'Stylelint';

export default async function stylelintCheck() {
  try {
    await execaCommand(
      'pnpm stylelint ./**/*.{css,scss,sass} --max-warnings 0',
    );
  } catch (error) {
    const { stdout } = error as { stdout: string };
    const lines = stdout.split('\n');

    // If no Stylelint problems detected, throw the error
    if (
      !/^\d+ problems \(\d+ errors, \d+ warnings\)$/.test(
        lines[lines.length - 2],
      )
    ) {
      throw error;
    }

    throw new Error(
      `Stylelint problems found in the following files:

      ${lines
        .filter((line) => {
          return (
            line !== '' &&
            !line.match(/^\d+ problems \(\d+ errors, \d+ warnings\)|\d+:\d+/)
          );
        })
        .map((line) => `${process.cwd()}/${line}`)
        .join('\n')}

        Open these files in your editor - there should be problems to fix.
      `,
    );
  }
}
