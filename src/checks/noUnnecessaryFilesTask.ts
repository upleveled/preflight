// git ls-tree --full-tree --name-only -r HEAD
import execa from 'execa';
import { ListrTaskWrapper, ListrContext } from 'listr2';
import { DefaultRenderer } from 'listr2/dist/renderer/default.renderer';

const title = 'No unnecessary files committed check';

async function noUnnecessaryFiles(
  ctx: ListrContext,
  task: ListrTaskWrapper<any, typeof DefaultRenderer>
): Promise<void> {
  try {
    const response = await execa.command(
      'git ls-files .DS_Store node_modules/ .env'
    );

    if (response.stdout) {
      throw Error('Forbidden files founded:\n' + response.stdout);
    }

    task.title = 'files on commit checked!';
  } catch (error) {
    task.title = 'ups!, something unexpected happen';
    throw new Error(error);
  }
}

const noUnnecessaryFilesTask = {
  title,
  task: noUnnecessaryFiles,
};

export default noUnnecessaryFilesTask;
