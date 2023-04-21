import { ESLint } from 'eslint';
import { execaCommand } from 'execa';

const errorKey = 'errorCount' as const;

export const title = 'ESLint';

export default async function eslintCheck() {
  try {
    await execaCommand('pnpm eslint . --max-warnings 0  --format json');
  } catch (error) {
    const { stdout } = error as { stdout: string };

    // If no ESLint problems detected, throw the error
    if (!new RegExp(`"${errorKey}":`).test(stdout)) {
      throw error;
    }

    throw new Error(
      `ESLint problems found in the following files:
        ${(JSON.parse(stdout) as ESLint.LintResult[])
          .filter(
            (stylelintResult) =>
              !(
                stylelintResult[errorKey] === 0 &&
                stylelintResult.warningCount === 0
              ),
          )
          .map(({ filePath }) =>
            // Make paths relative to the project:
            // before: /home/projects/next-student-project/app/api/hello/route.js
            // after: app/api/hello/route.js
            filePath.replace(process.cwd(), '').slice(1),
          )
          .join('\n')}

        Open these files in your editor - there should be problems to fix
      `,
    );
  }
}
