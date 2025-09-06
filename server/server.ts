import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import replay from './events/transaction/replay'
import StartTransactionEvent from './events/transaction/startTransactionEvent'
import PaymentEvent from './events/transaction/paymentEvent'
import EndTransactionEvent from './events/transaction/endTransactionEvent'
import TransactionEvent from './events/transaction/transaction'
import ResetTransactionEvent from './events/transaction/resetTransactionEvent'
import { TransactionId } from './models/transaction'

const app = new Hono();
const onMemoryStore: Map<TransactionId, TransactionEvent[]> = new Map();

app.use('/', serveStatic({ path: './public/index.html' }))
app.use('/script.js', serveStatic({ path: './public/script.js' }))

app.get('/api/events', (c) => {
  const transactionId = c.req.query("transactionId");
  const events = onMemoryStore.get(transactionId as TransactionId) ?? [];

  return c.json({ data: events });
});

app.delete('/api/v1/events/transaction', async (c) => {
  const { transactionId } = await c.req.json<{ transactionId: string }>();
  onMemoryStore.set(transactionId as TransactionId, []);

  return c.json({ data: {} });
})

app.get("/api/v1/transaction/latest", (c) => {
  const transactionId = c.req.query("transactionId");

  if (transactionId) {
    const events = onMemoryStore.get(transactionId as TransactionId) ?? [];
    const result = replay(events);

    if (result) {
      return c.json({ data: result })
    }
  }

  return c.json({ data: {} })
});

app.get("/api/v1/transaction/replay", (c) => {
  const transactionId = c.req.query("transactionId");

  if (transactionId) {
    const events = onMemoryStore.get(transactionId as TransactionId) ?? [];
    const offset = c.req.query("offset") ?? '0';
    const sliceEvents = events.slice(0, parseInt(offset, 10) + 1);

    return c.json({ data: replay(sliceEvents) })
  }

  return c.json({ data: {} })
})

app.post("/api/v1/events/transactions/startTransactionEvent", async (c) => {
  const { invoiceAmount, invoiceDate } = await c.req.json<{ invoiceAmount: string, invoiceDate: string }>();

  const event = new StartTransactionEvent(
    parseInt(invoiceAmount, 10),
    new Date(invoiceDate),
  )
  const events = [...(onMemoryStore.get(event.transactionId) ?? []), event];
  onMemoryStore.set(event.transactionId, events);

  c.status(201);
  return c.json({ data: replay(events) })
});

app.post("/api/v1/events/transactions/paymentEvent", async (c) => {
  const { transactionId, paymentAmount } = await c.req.json<{ transactionId: string, paymentAmount: string }>();

  // 領収は最新の請求に対して行う
  if (transactionId) {
    const transactionId_ = transactionId as TransactionId;
    const events = onMemoryStore.get(transactionId_) ?? [];
    const transaction = replay(events);

    const latestInvoice = transaction?.latestInvoice();
    if (!latestInvoice) {
      c.status(400);

      return c.json({ message: "請求が作成されていません" })
    }

    const event = new PaymentEvent(
      latestInvoice.invoiceId,
      parseInt(paymentAmount, 10),
    )
    const appendEvent = [...events, event];
    onMemoryStore.set(transactionId_, appendEvent);

    c.status(201);

    return c.json({ data: replay(appendEvent) })
  }

  return c.json({ data: {} });
});

app.post("/api/v1/events/transactions/resetTransactionEvent", async (c) => {
  const { transactionId } = await c.req.json<{ transactionId: string }>();

  if (transactionId) {
    const transactionId_ = transactionId as TransactionId;
    const events = onMemoryStore.get(transactionId_) ?? [];

    const event = new ResetTransactionEvent(transactionId);
    const appendEvent = [...events, event];
    onMemoryStore.set(transactionId_, appendEvent);

    c.status(201);
    return c.json({ data: replay(appendEvent) })
  }

  return c.json({ data: {} });
});

app.post("/api/v1/events/transactions/endTransactionEvent", async (c) => {
  const { transactionId } = await c.req.json<{ transactionId: string }>();

  if (transactionId) {
    const transactionId_ = transactionId as TransactionId;
    const events = onMemoryStore.get(transactionId_) ?? [];

    const event = new EndTransactionEvent(transactionId);
    const appendEvent = [...events, event];
    onMemoryStore.set(transactionId_, appendEvent);

    c.status(201);
    return c.json({ data: replay(appendEvent) })
  }

  return c.json({ data: {} });
});

const port = 8787;
console.log(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port,
})
