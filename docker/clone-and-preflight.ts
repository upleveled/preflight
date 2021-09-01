#!/usr/bin/env node

import execa from 'execa';

(async () => {
  const regex = /^https:\/\/github\.com\/[a-zA-Z0-9\-.]+\/[a-zA-Z0-9\-.]+$/;

  if (!process.argv[2].match(regex)) {
    console.error(`Argument doesn't match GitHub URL format. Example:

  $ docker run ghcr.io/upleveled/preflight https://github.com/upleveled/preflight-test-project-react-passing`);
    process.exit(1);
  }

  const repoPath = 'fixtures/checked-repo ';

  async function executeCommand(command: string, cwd?: string) {
    const res = await execa.command(command, {
      cwd,
      reject: false,
    });

    const { stderr, stdout } = res;

    console.log(res);
    console.log(res.exitCode);
    console.log(res.exitCode !== 0);
    console.log('---------------------------------------> stderr', stderr);

    if (false) {
      console.error(stderr);
      process.exit(1);
    } else {
      return stdout;
    }
  }

  await executeCommand(
    `git clone --depth 1 --single-branch --branch=main ${process.argv[2]} ${repoPath} --config core.autocrlf=input`,
  );

  await executeCommand('yarn install --ignore-scripts', { cwd: repoPath });
  const preflightCommand = await executeCommand(`preflight`);

  console.log(preflightCommand);
})();
