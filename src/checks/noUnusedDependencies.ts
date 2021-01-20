import execa from 'execa';
import wordWrap from '../wordWrap';

export const title = 'No unused dependencies';

export default async function noUnusedDependencies() {
  try {
    const { stdout } = await execa.command('yarn depcheck');

    if (stdout.includes('No depcheck issue')) {
      throw Error(wordWrap(stdout));
    }
  } catch (error) {
    throw Error(wordWrap(error));
  }
}
