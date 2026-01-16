import { AnalyticsIngestSchema, type EventName } from "@shared/analytics-events";
import { auth } from "../firebase";

/**
 * Generate a ULID-like unique ID for event idempotency.
 * Using crypto.randomUUID for simplicity (available in modern browsers).
 */
function generateEventId(): string {
  // Use crypto.randomUUID if available, fallback to timestamp + random
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Get or create a persistent session ID for this browser session.
 * Stored in sessionStorage so it persists across page navigations
 * but clears when the browser tab is closed.
 */
function getSessionId(): string {
  const key = "skatehubba_session_id";
  let sessionId = sessionStorage.getItem(key);
  if (!sessionId) {
    sessionId = generateEventId();
    sessionStorage.setItem(key, sessionId);
  }
  return sessionId;
}

/**
 * Log an analytics event to the server.
 *
 * Key features:
 * - Only logs when user is authenticated (server needs UID)
 * - Generates idempotency key (event_id) to prevent duplicate counting on retry
 * - Validates payload before sending (catches dev mistakes early)
 * - Uses keepalive to ensure events are sent even on page unload
 * - Silently fails - analytics should never break the app
 *
 * @param event_name - Event type from allowlist (e.g., "battle_created")
 * @param properties - Event-specific data (validated per event type on server)
 *
 * @example
 * ```ts
 * // Log a battle creation
 * await logEvent("battle_created", {
 *   battle_id: "abc123",
 *   matchmaking: "open",
 * });
 *
 * // Log a vote
 * await logEvent("battle_voted", {
 *   battle_id: "abc123",
 *   vote: "clean",
 * });
 * ```
 */
export async function logEvent(
  event_name: EventName,
  properties: Record<string, unknown> = {}
): Promise<void> {
  try {
    // Only log events for authenticated users
    const user = auth.currentUser;
    if (!user) {
      return;
    }

    // Get fresh ID token for auth
    const token = await user.getIdToken();

    const payload = {
      event_id: generateEventId(),
      event_name,
      occurred_at: new Date().toISOString(),
      session_id: getSessionId(),
      source: "web" as const,
      app_version: import.meta.env.VITE_APP_VERSION ?? "dev",
      properties,
    };

    // Validate before sending (catches dev mistakes early)
    const parsed = AnalyticsIngestSchema.safeParse(payload);
    if (!parsed.success) {
      console.warn("[Analytics] Invalid event payload:", parsed.error.flatten());
      return;
    }

    // Send to server - fire and forget
    await fetch("/api/analytics/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      keepalive: true, // Helps on navigation/unload
    });
  } catch (error) {
    // Silently fail - analytics should never break the app
    console.warn("[Analytics] Failed to log event:", error);
  }
}

/**
 * Log multiple events at once (useful for offline sync).
 *
 * @param events - Array of event name + properties pairs
 */
export async function logEventBatch(
  events: Array<{ event_name: EventName; properties?: Record<string, unknown> }>
): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) return;

    const token = await user.getIdToken();
    const sessionId = getSessionId();
    const appVersion = import.meta.env.VITE_APP_VERSION ?? "dev";

    const payload = events.map((ev) => ({
      event_id: generateEventId(),
      event_name: ev.event_name,
      occurred_at: new Date().toISOString(),
      session_id: sessionId,
      source: "web" as const,
      app_version: appVersion,
      properties: ev.properties ?? {},
    }));

    await fetch("/api/analytics/events/batch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch (error) {
    console.warn("[Analytics] Failed to log event batch:", error);
  }
}
