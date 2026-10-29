#!/usr/bin/env -S node --experimental-strip-types

import { readFile } from 'node:fs/promises';
import { argv, cwd, exit } from 'node:process';
import { execa as bindExeca, ExecaError } from 'execa';

if (
  !argv[2] ||
  !argv[2].match(/^https:\/\/github\.com\/[a-zA-Z0-9\-.]+\/[a-zA-Z0-9\-.]+$/)
) {
  console.error(`Argument doesn't match GitHub URL format. Example:

$ docker run ghcr.io/upleveled/preflight https://github.com/upleveled/preflight-test-project-react-passing`);
  exit(1);
}

const projectPath = 'project-to-check';
const execa = bindExeca({ cwd: projectPath });

console.log(`Cloning ${argv[2]}...`);
await execa({
  // Reset default for the `git clone` command before projectPath
  // exists
  cwd: cwd(),
})`git clone --depth 1 ${
  !argv[3] ? [] : ['--branch', argv[3]]
} --single-branch ${argv[2]} ${projectPath} --config core.autocrlf=input`;

console.log('Installing dependencies...');
try {
  await execa`pnpm install`;
} catch (error) {
  // TODO: Remove pnpm 10 Alpine workaround after student
  // material no longer supports pnpm 10
  const pnpmVersionWithoutAlpineNativeBinary =
    error instanceof ExecaError
      ? error.message.match(
          /Cannot run @pnpm\/exe@([\d.]+) on this host: it ships no native binary for linux-x64-musl/,
        )?.[1]
      : undefined;

  if (!pnpmVersionWithoutAlpineNativeBinary) throw error;

  await execa`npm install --global --prefix=/tmp/preflight-pnpm pnpm@${pnpmVersionWithoutAlpineNativeBinary}`;
  process.env.PATH = `/tmp/preflight-pnpm/bin:${process.env.PATH}`;
  await execa`pnpm install`;
}

const projectPackageJson = JSON.parse(
  await readFile(`${projectPath}/package.json`, 'utf-8'),
) as {
  dependencies?: Record<string, string>;
};

// Generate Next.js types needed for ESLint and TypeScript compiler
// https://nextjs.org/docs/app/api-reference/cli/next#next-typegen-options
if (projectPackageJson.dependencies?.next) {
  console.log('Generating Next.js types...');
  await execa`pnpm next typegen`;
}

if (projectPackageJson.dependencies?.postgres) {
  console.log('Setting up PostgreSQL database...');

  // Create directory for PostgreSQL socket
  await execa`mkdir -p /postgres-volume/run/postgresql/data`;
  await execa`chown -R postgres:postgres /postgres-volume/run/postgresql`;

  // Set database connection environment variables, inherited in
  // all future execa calls
  process.env.PGHOST = 'localhost';
  process.env.PGDATABASE = 'project_to_check';
  process.env.PGUSERNAME = 'project_to_check';
  process.env.PGPASSWORD = 'project_to_check';

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
  const postgresProcess = await execa({
    // postgres user, for initdb and pg_ctl
    uid: Number((await execa`id -u postgres`).stdout),
    // Show output to simplify debugging
    stdout: ['inherit', 'pipe'],
    stderr: ['inherit', 'pipe'],
  })`bash ./scripts/alpine-postgresql-setup-and-start.sh`;

  const preflightEnvironmentVariables = postgresProcess.stdout.match(
    /PREFLIGHT_ENVIRONMENT_VARIABLES:\n(\[[^\]]+\])/,
  )?.[1];

  if (preflightEnvironmentVariables) {
    for (const name of JSON.parse(preflightEnvironmentVariables) as string[]) {
      process.env[name] = 'UPLEVELED_PREFLIGHT_PLACEHOLDER';
    }
  }

  console.log('Running migrations...');
  await execa`pnpm migrate up`;
}

console.log('Running Preflight...');

const { exitCode } = await execa({
  reject: false,
  stdout: 'inherit',
  stderr: 'inherit',
})`preflight`;

exit(exitCode);
