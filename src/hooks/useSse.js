import { useEffect, useRef } from 'react';

const RECONNECT_DELAY = 3000; // Wait 3 seconds before reconnecting.

// Opens a Server-Sent Events (SSE) stream and calls onEvent(eventName, data) for every event.
//
// Why not the browser's EventSource? EventSource cannot send an Authorization header,
// but our backend needs "Authorization: Bearer <token>". So we use fetch() and read
// the response body ourselves, piece by piece, with a ReadableStream reader.
//
// SSE text format sent by the server (events are separated by an empty line):
//   event:notification
//   data:{"id":1,"message":"..."}
export default function useSse(url, token, onEvent) {
  // Keep the latest onEvent in a ref, so a new function does not restart the connection.
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!token) return undefined; // Only connect when logged in.

    const controller = new AbortController(); // Lets us close the stream on logout.
    let retryTimer;

    async function connect() {
      try {
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`SSE failed with status ${response.status}`);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        // Read chunks until the server closes the stream.
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // A complete event ends with an empty line. Keep any unfinished part in the buffer.
          const events = buffer.split(/\r?\n\r?\n/);
          buffer = events.pop();
          events.forEach(handleRawEvent);
        }
      } catch (error) {
        if (controller.signal.aborted) return; // We closed it on purpose.
        console.warn('Notification stream error:', error.message);
      }
      // The stream ended or failed: try again after a short wait.
      if (!controller.signal.aborted) {
        retryTimer = setTimeout(connect, RECONNECT_DELAY);
      }
    }

    // Turns "event:x\ndata:{...}" into onEvent('x', {...}).
    function handleRawEvent(raw) {
      let eventName = 'message';
      const dataLines = [];
      raw.split(/\r?\n/).forEach((line) => {
        if (line.startsWith('event:')) eventName = line.slice(6).trim();
        if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
      });
      if (dataLines.length === 0) return; // Comment or heartbeat line.
      try {
        onEventRef.current(eventName, JSON.parse(dataLines.join('\n')));
      } catch {
        onEventRef.current(eventName, dataLines.join('\n')); // Not JSON, pass the text.
      }
    }

    connect();

    // Cleanup: runs on logout or when the page closes.
    return () => {
      controller.abort();
      clearTimeout(retryTimer);
    };
  }, [url, token]);
}
