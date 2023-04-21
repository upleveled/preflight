import { sep } from 'node:path';
import { ESLint } from 'eslint';
import { execaCommand } from 'execa';

export const title = 'ESLint';

export default async function eslintCheck() {
  try {
    await execaCommand('pnpm eslint . --max-warnings 0  --format json');
  } catch (error) {
    const { stdout } = error as { stdout: string };

    let eslintResults;

    try {
      eslintResults = JSON.parse(stdout) as ESLint.LintResult[];
    } catch {
      throw error;
    }

    // If no ESLint problems detected, throw the error
    if (
      !eslintResults.every(
        (result) => 'errorCount' in result && 'warningCount' in result,
      )
    ) {
      throw new Error(
        `ESLint results are missing 'errorCount' and 'warningCount' properties - please repport the following output to the UpLeveled team:
          ${stdout}
        `,
      );
    }

    throw new Error(
      `ESLint problems found in the following files:
        ${eslintResults
          .filter(
            (eslintResult) =>
              eslintResult.errorCount > 0 || eslintResult.warningCount > 0,
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
