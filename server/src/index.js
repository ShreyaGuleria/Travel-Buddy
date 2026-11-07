import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';

const portValue = process.env.PORT ?? '3000';
const port = Number(portValue);

if (!/^\d+$/.test(portValue) || !Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer from 1 to 65535.');
}

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'travelbuddy-api' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'not_found' });
});

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  const status = err.status >= 400 && err.status < 500 ? err.status : 500;
  const error = err.type === 'entity.parse.failed' ? 'invalid_json'
    : err.type === 'entity.too.large' ? 'payload_too_large'
    : status < 500 ? 'bad_request' : 'internal_error';

  console.error(`Request failed (${status}, ${error}).`);
  res.status(status).json({ error });
});

const server = createServer(app);

if (process.env.SOCKET_SPIKE_ENABLED === 'true') {
  const io = new Server(server, { serveClient: false });

  io.on('connection', (socket) => {
    console.log(`Spike connected: ${socket.id}`);

    socket.on('spike:echo', (payload) => {
      const validString = (value, max) =>
        typeof value === 'string' && value.trim().length > 0 && value.length <= max;

      if (!payload || typeof payload !== 'object' || Array.isArray(payload)
        || !validString(payload.messageId, 80) || !validString(payload.text, 500)) {
        console.warn(`Spike rejected invalid payload: ${socket.id}`);
        socket.emit('spike:error', {
          error: 'invalid_payload',
          message: 'Expected messageId (1-80) and text (1-500) as nonempty strings.',
        });
        return;
      }

      const message = { messageId: payload.messageId.trim(), text: payload.text.trim() };
      socket.emit('spike:echo:reply', message);
      socket.broadcast.emit('spike:message', message);
    });

    socket.on('disconnect', () => console.log(`Spike disconnected: ${socket.id}`));
    socket.on('error', () => console.error(`Spike socket error: ${socket.id}`));
  });

  io.engine.on('connection_error', (err) => {
    console.error(`Spike connection error (code ${err.code}).`);
  });
  console.log('Temporary public Socket.IO spike enabled; use test data only.');
} else {
  console.log('Socket.IO spike disabled.');
}

server.listen(port, '0.0.0.0', () => {
  console.log(`TravelBuddy API listening on 0.0.0.0:${port}`);
});

server.on('error', (err) => {
  console.error(`Server failed to listen on port ${port} (${err.code ?? 'unknown_error'}).`);
  process.exitCode = 1;
});
