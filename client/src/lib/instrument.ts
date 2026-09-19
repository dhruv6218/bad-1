type ErrorContext = Record<string, unknown>;

const reportingEndpoint = import.meta.env.VITE_ERROR_REPORTING_URL as string | undefined;

export function captureException(error: unknown, context: ErrorContext = {}) {
  const eventId = crypto.randomUUID();
  const normalized = error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : { message: String(error) };
  const payload = { event_id: eventId, error: normalized, context, url: window.location.href, user_agent: navigator.userAgent, occurred_at: new Date().toISOString() };
  console.error(`[Astrix error ${eventId}]`, error, context);
  if (reportingEndpoint) {
    void fetch(reportingEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), keepalive: true }).catch(() => undefined);
  }
  return eventId;
}

export function captureMessage(message: string, context: ErrorContext = {}) {
  return captureException(new Error(message), context);
}
