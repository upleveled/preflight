import execa from 'execa';
import commandExample from '../commandExample';
import wordWrap from '../wordWrap';

export const title = 'No unused dependencies';

export default async function noUnusedDependencies() {
  try {
    const { stdout } = await execa.command('yarn depcheck');

    if (stdout.includes('No depcheck issue')) {
      return;
    } else {
      throw Error(stdout);
    }
  } catch (error) {
    throw error.stdout
      ? Error(
          wordWrap(
            `Remove next unused dependencies:
             ${error.stdout
               .split('\n')
               .filter((str: string) => str.includes('* '))
               .map((str: string) => str + '\n')
               .join('')}
               Remove these dependencies running the following command for each dependency:
               ${commandExample('yarn remove <dependency name here>')}
               `,
          ),
        )
      : Error(error);
  }
}
