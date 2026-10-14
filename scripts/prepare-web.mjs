import { mkdtemp, readdir, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';

const temp = await mkdtemp(join(tmpdir(), 'ride-garage-site-'));
const source = join(temp, 'source');
const url = 'https://github.com/Lagsautomotive/Ride-garage.git';
try {
  const clone = spawnSync('git', ['clone', '--depth', '1', '--branch', 'main', url, source], {
    encoding: 'utf8', timeout: 120000
  });
  if (clone.status !== 0) throw new Error('Unable to clone Ride Garage: ' + (clone.stderr || clone.error?.message || clone.status));
  const allowed = /\.(html|js|css|json|webmanifest|png|jpg|jpeg|webp|svg|ico|woff2?|txt)$/i;
  await rm('www', { recursive: true, force: true });
  let count = 0;
  async function visit(folder, relative = '') {
    for (const ent of await readdir(folder, { withFileTypes: true })) {
      if (ent.name.startsWith('.')) continue;
      const rel = relative ? join(relative, ent.name) : ent.name;
      const full = join(folder, ent.name);
      if (ent.isDirectory()) { await visit(full, rel); continue; }
      if (!ent.isFile() || !allowed.test(ent.name)) continue;
      let bytes = await readFile(full);
      if (rel === 'index.html') {
        let html = bytes.toString('utf8');
        html = html.replace(/<script>if\('serviceWorker' in navigator\).*?<\/script>/s, '');
        bytes = Buffer.from(html);
      }
      const output = join('www', rel);
      await mkdir(dirname(output), { recursive: true });
      await writeFile(output, bytes);
      count++;
    }
  }
  await visit(source);
  await readFile('www/index.html');
  console.log('Prepared ' + count + ' Ride Garage web files from Git clone');
} finally {
  await rm(temp, { recursive: true, force: true });
}
