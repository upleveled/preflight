#!/usr/bin/env -S node --experimental-strip-types

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { argv, cwd, exit } from 'node:process';
import { execa as bindExeca } from 'execa';

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
  // Reset default for the `git clone` command before projectPath exists
  cwd: cwd(),
})`git clone --depth 1 ${
  !argv[3] ? [] : ['--branch', argv[3]]
} --single-branch ${argv[2]} ${projectPath} --config core.autocrlf=input`;

console.log('Installing dependencies...');
await execa`pnpm install`;

// Exit code of grep will be 0 if the `"postgres":`
// string is found in package.json, indicating that
// Postgres.js is installed and the project uses
// a PostgreSQL database
const projectUsesPostgresql =
  (
    await execa({
      // Avoid crashing when `grep` doesn't find the string
      reject: false,
    })`grep package.json -e "postgres":`
  ).exitCode === 0;

if (projectUsesPostgresql) {
  console.log('Setting up PostgreSQL database...');

  // Create directory for PostgreSQL socket
  await execa`mkdir -p /postgres-volume/run/postgresql/data`;
  await execa`chown -R postgres:postgres /postgres-volume/run/postgresql`;

  // Set database connection environment variables from .env.example,
  // inherited in all future execa calls
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
  const postgresUid = Number((await execa`id -u postgres`).stdout);
  const postgresProcess = await execa({
    // postgres user, for initdb and pg_ctl
    uid: postgresUid,
    // Show output to simplify debugging
    stdout: 'pipe',
    stderr: 'inherit',
  })`bash ./scripts/alpine-postgresql-setup-and-start.sh`;

  const output = postgresProcess.stdout;
  const startMarker = '### START_ENV ###';
  const endMarker = '### END_ENV ###';

  const startIndex = output.indexOf(startMarker);
  const endIndex = output.indexOf(endMarker);

  const envLines = output
    .slice(startIndex + startMarker.length, endIndex)
    .trim()
    .split('\n');

  for (const line of envLines) {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
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
