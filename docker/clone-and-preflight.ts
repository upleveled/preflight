#!/usr/bin/env node

import { argv, exit } from 'node:process';
import { execaCommand, Options } from 'execa';

const regex = /^https:\/\/github\.com\/[a-zA-Z0-9\-.]+\/[a-zA-Z0-9\-.]+$/;

if (!argv[2] || !argv[2].match(regex)) {
  console.error(`Argument doesn't match GitHub URL format. Example:

$ docker run ghcr.io/upleveled/preflight https://github.com/upleveled/preflight-test-project-react-passing`);
  exit(1);
}

const projectPath = 'project-to-check';

async function executeCommand(command: string, options?: Pick<Options, 'cwd'>) {
  let all: string | undefined = '';
  let exitCode = 0;

  try {
    ({ all, exitCode } = await execaCommand(command, {
      cwd: options?.cwd,
      all: true,
    }));
  } catch (error) {
    console.error(error);
    exit(1);
  }

  if (exitCode !== 0) {
    console.error(all);
    exit(1);
  } else {
    return all;
  }
}

console.log(`Cloning ${argv[2]}...`);
await executeCommand(
  `git clone --depth 1 ${
    !argv[3] ? '' : `--branch ${argv[3]}`
  } --single-branch ${argv[2]} ${projectPath} --config core.autocrlf=input`,
);

console.log('Installing dependencies...');
await executeCommand('pnpm install', { cwd: projectPath });

// Exit code of grep will be 0 if the `"postgres":`
// string is found in package.json, indicating that
// Postgres.js is installed and the project uses
// a PostgreSQL database
const projectUsesPostgresql =
  (
    await execaCommand('grep package.json -e \'"postgres":\'', {
      cwd: projectPath,
      shell: true,
      reject: false,
    })
  ).exitCode === 0;

if (projectUsesPostgresql) {
  console.log('Setting up PostgreSQL database...');

  // Set database connection environment variables (inherited in
  // all future execaCommand / executeCommand calls)
  process.env.PGHOST = 'localhost';
  process.env.PGDATABASE = 'project_to_check';
  process.env.PGUSERNAME = 'project_to_check';
  process.env.PGPASSWORD = 'project_to_check';

  // Create directory for PostgreSQL socket
  await executeCommand('mkdir -p /postgres-volume/run/postgresql/data');
  await executeCommand(
    'chown -R postgres:postgres /postgres-volume/run/postgresql',
  );

  // Run script as postgres user to:
  // - Create data directory
  // - Init database
  // - Start database
  // - Create database
  // - Create database user
  // - Create schema
  // - Grant permissions to database user
  //
  // Example script:
  // https://github.com/upleveled/preflight-test-project-next-js-passing/blob/e65717f6951b5336bb0bd83c15bbc99caa67ebe9/scripts/alpine-postgresql-setup-and-start.sh
  const postgresUid = Number((await executeCommand('id -u postgres'))!);
  await execaCommand('bash ./scripts/alpine-postgresql-setup-and-start.sh', {
    cwd: projectPath,
    // postgres user, for initdb and pg_ctl
    uid: postgresUid,
    // Show output to simplify debugging
    stdout: 'inherit',
    stderr: 'inherit',
  });

  console.log('Running migrations...');
  await executeCommand('pnpm migrate up', { cwd: projectPath });
}

console.log('Running Preflight...');

const { exitCode } = await execaCommand('preflight', {
  cwd: projectPath,
  reject: false,
  stdout: 'inherit',
  stderr: 'inherit',
});

exit(exitCode);
