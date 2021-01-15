import execa from 'execa';

export const title = 'ESLint';

export default async function eslintCheck() {
  try {
    await execa.command('yarn eslint . --max-warnings 0  --format compact');
  } catch (err) {
    throw new Error(
      `Errors found in files:\n${err.stdout
        .split('\n')
        .filter((line: string) => /^(\/|[A-Z]:\\)/.test(line))
        .map((line: string) => line.match(/^(([A-Z]:)?[^:]+):/)?.[1])
        .reduce((linesWithoutDuplicates: string[], line: string) => {
          if (!linesWithoutDuplicates.includes(line)) {
            linesWithoutDuplicates.push(line);
          }
          return linesWithoutDuplicates;
        }, [])
        .join('\n')}`
    );
  }
}
