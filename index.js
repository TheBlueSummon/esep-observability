const express = require('express');
const { MongoClient } = require('mongodb');
const { trace, metrics, SpanStatusCode } = require('@opentelemetry/api');
const sdk = require('./tracing');
const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017', { serverSelectionTimeoutMS: 5000 });
const app = express();
const tracer = trace.getTracer('todo-application');
const meter = metrics.getMeter('todo-application');
const requests = meter.createCounter('todo.requests', { description: 'Completed GET /todo requests' });
const duration = meter.createHistogram('todo.request.duration', { unit: 'ms', description: 'GET /todo handler duration' });
let todos, server;
app.use(express.json());

app.get('/todo', async (req, res) => tracer.startActiveSpan('todo.list', async span => {
  const start = performance.now();
  let status = 200;
  try {
    const items = await todos.find({}).toArray();
    span.setAttribute('todo.count', items.length);
    span.addEvent('todos.loaded', { 'todo.count': items.length });
    res.json(items);
    console.log(JSON.stringify({ timestamp: new Date().toISOString(), severity: 'INFO', message: 'Todos retrieved', count: items.length, ...span.spanContext() }));
  } catch (error) {
    status = 500;
    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    console.error(JSON.stringify({ timestamp: new Date().toISOString(), severity: 'ERROR', message: error.message, ...span.spanContext() }));
    res.status(500).json({ error: 'Unable to retrieve todos' });
  } finally {
    const attributes = { 'http.route': '/todo', 'http.response.status_code': status };
    requests.add(1, attributes);
    duration.record(performance.now() - start, attributes);
    span.end();
  }
}));

// Retain the starter application's single-item endpoint.
app.get('/todo/:id', async (req, res) => {
  const todo = await todos.findOne({ id: req.params.id });
  if (!todo) return res.status(404).json({ error: 'Todo not found' });
  res.json(todo);
});

async function startServer() {
  await client.connect();
  todos = client.db('todo').collection('todos');
  for (const [id, title] of [['1', 'Buy groceries'], ['2', 'Install Aspecto'], ['3', 'buy my own name domain']]) {
    await todos.updateOne({ _id: id }, { $setOnInsert: { id, title } }, { upsert: true });
  }
  server = app.listen(Number(process.env.PORT || 3000), '127.0.0.1', () => console.log('Listening on http://localhost:3000'));
}
let stopping = false;
async function shutdown() {
  if (stopping) return;
  stopping = true;
  if (server) await new Promise(resolve => server.close(resolve));
  await client.close();
  await sdk.shutdown();
}
process.on('SIGINT', () => shutdown().catch(console.error));
process.on('SIGTERM', () => shutdown().catch(console.error));
startServer().catch(async error => { console.error(error); process.exitCode = 1; await shutdown(); });
