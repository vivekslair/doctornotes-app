import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

test('Railway entrypoint serves the prototype on PORT and shuts down cleanly', async t => {
  const child = spawn(process.execPath, ['server.mjs'], {
    cwd: new URL('..', import.meta.url),
    env: { ...process.env, PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  t.after(() => { if (child.exitCode === null) child.kill('SIGKILL'); });
  let errors = '';
  child.stderr.on('data', chunk => { errors += chunk; });
  const port = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Startup timed out: ' + errors)), 5000);
    let output = '';
    child.once('error', reject);
    child.once('exit', code => {
      clearTimeout(timeout);
      reject(new Error(`Server exited (${code}): ${errors}`));
    });
    child.stdout.on('data', chunk => {
      output += chunk;
      const match = output.match(/Rounds listening on 0\.0\.0\.0:(\d+)/);
      if (match) { clearTimeout(timeout); resolve(match[1]); }
    });
  });
  const base = `http://127.0.0.1:${port}`;
  const health = await fetch(`${base}/health`, { headers: { Host: 'healthcheck.railway.app' } });
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: 'ok' });
  const home = await fetch(base);
  assert.equal(home.status, 200);
  assert.match(await home.text(), /Rounds/);
  for (const [path, type] of [['/app.js?v=2', 'text/javascript'], ['/style.css?v=2', 'text/css']]) {
    const response = await fetch(base + path);
    assert.equal(response.status, 200);
    assert.ok(response.headers.get('content-type').startsWith(type));
    assert.ok((await response.text()).length > 100);
  }
  const head = await fetch(base, { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.ok(Number(head.headers.get('content-length')) > 0);
  assert.equal(await head.text(), '');
  for (const path of ['/server.mjs', '/package.json', '/.env', '/%2e%2e/package.json', '/missing.js']) {
    assert.equal((await fetch(base + path)).status, 404, path);
  }
  assert.equal((await fetch(base, { method: 'POST', body: 'test' })).status, 405);
  const exited = once(child, 'exit');
  child.kill('SIGTERM');
  const [code] = await exited;
  assert.equal(code, 0);
});
