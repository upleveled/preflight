import { sep } from 'node:path';
import { ESLint } from 'eslint';
import { execaCommand } from 'execa';

const errorKey = 'errorCount' as const;
const warningKey = 'warningCount' as const;

export const title = 'ESLint';

export default async function eslintCheck() {
  try {
    await execaCommand('pnpm eslint . --max-warnings 0  --format json');
  } catch (error) {
    const { stdout } = error as { stdout: string };

    // If no ESLint problems detected, throw the error
    if (!new RegExp(`"${errorKey}":|"${warningKey}":`).test(stdout)) {
      throw error;
    }

    throw new Error(
      `ESLint problems found in the following files:
        ${(JSON.parse(stdout) as ESLint.LintResult[])
          .filter(
            (eslintResult) =>
              !(eslintResult[errorKey] === 0 && eslintResult[warningKey] === 0),
          )
          // Make paths relative to the project:
          // Before:
          //   macOS / Linux: /home/projects/next-student-project/app/api/hello/route.js
          //   Windows: C:\Users\Lukas\projects\next-student-project\app\api\hello\route.js
          // After: app/api/hello/route.js
          .map(({ filePath }) => filePath.replace(`${process.cwd()}${sep}`, ''))
          .join('\n')}

        Open these files in your editor - there should be problems to fix
      `,
    );
  }
}
