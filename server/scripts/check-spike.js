import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { io } from 'socket.io-client';

const base = process.argv[2] ?? 'http://127.0.0.1:3000';
const disabled = process.argv.includes('--disabled');
const sockets = [];
const eventTimeout = 10000;
const invalidError = {
  error: 'invalid_payload',
  message: 'Expected messageId (1-80) and text (1-500) as nonempty strings.',
};

function makeClient() {
  const socket = io(base, {
    path: '/socket.io',
    transports: ['websocket'],
    forceNew: true,
    reconnection: false,
    autoConnect: false,
    timeout: eventTimeout,
  });
  sockets.push(socket);
  return socket;
}

function waitFor(socket, event) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out waiting for ${event}`));
    }, eventTimeout);
    const receive = (value) => { cleanup(); resolve(value); };
    const failed = () => { cleanup(); reject(new Error(`Connection failed for ${event}`)); };
    function cleanup() {
      clearTimeout(timer);
      socket.off(event, receive);
      if (event === 'connect') socket.off('connect_error', failed);
    }
    socket.once(event, receive);
    if (event === 'connect') socket.once('connect_error', failed);
  });
}

async function httpCheck(path, status, body) {
  const response = await fetch(base + path, { signal: AbortSignal.timeout(90000) });
  assert.equal(response.status, status);
  assert.match(response.headers.get('content-type'), /application\/json/);
  assert.deepEqual(await response.json(), body);
}

try {
  // The health request also allows a sleeping free instance time to wake up.
  await httpCheck('/health', 200, { status: 'ok', service: 'travelbuddy-api' });
  await httpCheck('/does-not-exist', 404, { error: 'not_found' });
  console.log('PASS HTTP health and JSON 404');

  if (disabled) {
    await httpCheck('/socket.io/?EIO=4&transport=polling', 404, { error: 'not_found' });
    const client = makeClient();
    const rejected = waitFor(client, 'connect_error');
    client.connect();
    await rejected;
    assert.equal(client.connected, false);
    console.log('PASS disabled: Socket.IO path is 404 and WebSocket connection rejected');
  } else {
    const a = makeClient();
    const b = makeClient();
    const records = { aReply: [], bReply: [], aMessage: [], bMessage: [], aError: [] };
    a.on('spike:echo:reply', value => records.aReply.push(value));
    b.on('spike:echo:reply', value => records.bReply.push(value));
    a.on('spike:message', value => records.aMessage.push(value));
    b.on('spike:message', value => records.bMessage.push(value));
    a.on('spike:error', value => records.aError.push(value));

    const connected = Promise.all([waitFor(a, 'connect'), waitFor(b, 'connect')]);
    a.connect();
    b.connect();
    await connected;
    assert.notEqual(a.id, b.id);
    console.log(`PASS independent clients connected; transports A=${a.io.engine.transport.name}, B=${b.io.engine.transport.name}`);

    const payload = { messageId: `test-${randomUUID()}`, text: 'Hello from client A' };
    const received = Promise.all([waitFor(a, 'spike:echo:reply'), waitFor(b, 'spike:message')]);
    a.emit('spike:echo', { ...payload, text: `  ${payload.text}  `, extra: 'must be omitted' });
    assert.deepEqual(await received, [payload, payload]);

    for (const bad of [null, [], 'text', {}, { messageId: 'test', text: ' ' },
      { messageId: 12, text: 'hello' }, { messageId: 'x'.repeat(81), text: 'hello' },
      { messageId: 'test', text: 'x'.repeat(501) }]) {
      const rejected = waitFor(a, 'spike:error');
      a.emit('spike:echo', bad);
      assert.deepEqual(await rejected, invalidError);
    }

    // Absence claims apply to this bounded window, not to all future time.
    await delay(750);
    assert.deepEqual(records.aReply, [payload]);
    assert.deepEqual(records.bMessage, [payload]);
    assert.deepEqual(records.aMessage, []);
    assert.deepEqual(records.bReply, []);
    assert.equal(records.aError.length, 8);
    console.log(`PASS sender reply, peer-only broadcast, trimmed/allowlisted fields; messageId=${payload.messageId}`);
    console.log('PASS 8 invalid payloads; no extra reply/broadcast or sender broadcast during 750 ms observation');
  }
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exitCode = 1;
} finally {
  for (const socket of sockets) socket.disconnect();
}
