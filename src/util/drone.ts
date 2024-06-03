import { execa } from 'execa';

export async function isDrone() {
  const { stdout } = await execa({
    reject: false,
  })`cat /etc/os-release`;
  return /Alpine Linux/.test(stdout);
}
