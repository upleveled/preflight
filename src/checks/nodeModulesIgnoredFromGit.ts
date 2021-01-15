import execa from 'execa';

export const title = 'node_modules/ folder ignored from Git';

export default async function nodeModulesIgnoredFromGit() {
  // node_modules/ committed to git. Fix it like this:
  //
  // $ git somecommand --arguments here
  //
  // Another line of text here if you need

  const nodeModulesResponse = await execa.command('git ls-files node_modules/');

  if (nodeModulesResponse.stdout) {
    // TODO: Add command for removing them
    throw new Error(
      `node_modules/ folder committed to Git:\n${nodeModulesResponse.stdout}`
    );
  }

  // 2. check if gitignore is there

  const gitignoreResponse = await execa.command('git ls-files .gitigore');

  if (gitignoreResponse.stdout === '') {
    throw new Error('.gitignore not committed to Git');
  }

  // node_modules/ folder not found in .gitignore

  // 2. read .gitignore and see if there's a line with exactly `node_modules` or `node_modules/`
}
