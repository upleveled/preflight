// git ls-tree --full-tree --name-only -r HEAD
import execa from 'execa';
import { ListrTaskWrapper, ListrContext } from 'listr2';
import { DefaultRenderer } from 'listr2/dist/renderer/default.renderer';

const title = 'EsLint check';

async function eslintCheck(
  _ctx: ListrContext,
  task: ListrTaskWrapper<any, typeof DefaultRenderer>
): Promise<void> {
  try {
    await execa.command('yarn eslint . --max-warnings 0');
  } catch {
    task.title = 'EsLint check Failed!';
    throw new Error(' ');
  }
  task.title = 'EsLint check ok!';
}

const eslintTask = { title, task: eslintCheck };

export default eslintTask;
