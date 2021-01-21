import execa from 'execa';
import commandExample from '../commandExample';
import wordWrap from '../wordWrap';

export const title = 'No unused dependencies';

export default async function noUnusedDependencies() {
  try {
    const { stdout } = await execa.command(
      'yarn depcheck --ignores="eslint,depcheck,eslint-*,babel-*,tslib,typescript,@typescript-eslint/*,@upleveled/*,@size-limit/*"',
    );

    if (stdout.includes('No depcheck issue')) {
      return;
    }
  } catch (error) {
    throw Error(
      wordWrap(
        `Remove next unused dependencies:
           ${error.stdout
             .split('\n')
             .filter((str: string) => str.includes('* '))
             .map((str: string) => str + '\n')
             .join('')}
             Remove these dependencies running the following command for each dependency:
             ${commandExample('yarn remove <dependency name here>')}`,
      ),
    );
  }
}
