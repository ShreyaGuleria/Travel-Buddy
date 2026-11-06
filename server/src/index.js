import express from 'express';

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

const server = app.listen(port, '127.0.0.1', () => {
  console.log(`TravelBuddy API listening at http://127.0.0.1:${port}`);
});

server.on('error', (err) => {
  console.error(`Server failed to listen on port ${port} (${err.code ?? 'unknown_error'}).`);
  process.exitCode = 1;
});
