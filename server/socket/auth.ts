/**
 * Socket.io Authentication Middleware
 *
 * Verifies Firebase ID tokens on WebSocket connections.
 * Enterprise-grade security with rate limiting and audit logging.
 */

import type { Socket } from "socket.io";

// ExtendedError type for socket.io middleware
type ExtendedError = Error & { data?: unknown };
import { admin } from "../admin";
import { AuthService } from "../auth/service";
import logger from "../logger";
import type { SocketData } from "./types";

// Connection rate limiting (per IP)
const connectionAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_CONNECTIONS_PER_MINUTE = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

/**
 * Clean up stale rate limit entries
 */
function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [ip, data] of connectionAttempts.entries()) {
    if (now > data.resetAt) {
      connectionAttempts.delete(ip);
    }
  }
}

// Run cleanup every minute
setInterval(cleanupRateLimits, RATE_LIMIT_WINDOW_MS);

/**
 * Check rate limit for an IP address
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const existing = connectionAttempts.get(ip);

  if (!existing || now > existing.resetAt) {
    connectionAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (existing.count >= MAX_CONNECTIONS_PER_MINUTE) {
    return false;
  }

  existing.count++;
  return true;
}

/**
 * Socket authentication middleware
 *
 * Validates Firebase ID token from handshake auth and attaches user data to socket.
 *
 * @example Client usage:
 * ```ts
 * const socket = io({
 *   auth: {
 *     token: await user.getIdToken()
 *   }
 * });
 * ```
 */
export async function socketAuthMiddleware(
  socket: Socket,
  next: (err?: ExtendedError) => void
): Promise<void> {
  const startTime = Date.now();
  const ip = socket.handshake.address;

  try {
    // Rate limiting
    if (!checkRateLimit(ip)) {
      logger.warn("[Socket] Rate limit exceeded", { ip });
      return next(new Error("rate_limit_exceeded"));
    }

    // Extract token from auth
    const token = socket.handshake.auth?.token;

    if (!token || typeof token !== "string") {
      logger.warn("[Socket] Missing auth token", {
        ip,
        hasAuth: !!socket.handshake.auth,
      });
      return next(new Error("authentication_required"));
    }

    // Verify Firebase ID token
    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(token, true);
    } catch (error) {
      logger.warn("[Socket] Invalid token", {
        ip,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return next(new Error("invalid_token"));
    }

    // Look up user in database
    const user = await AuthService.findUserByFirebaseUid(decoded.uid);

    if (!user) {
      logger.warn("[Socket] User not found", {
        ip,
        firebaseUid: decoded.uid,
      });
      return next(new Error("user_not_found"));
    }

    if (!user.isActive) {
      logger.warn("[Socket] Inactive user attempted connection", {
        ip,
        odv: user.id,
      });
      return next(new Error("account_inactive"));
    }

    // Extract roles from Firebase custom claims
    const roles: string[] = [];
    if (decoded.admin) roles.push("admin");

    // Attach user data to socket
    const socketData: SocketData = {
      userId: user.id,
      odv: user.id,
      firebaseUid: decoded.uid,
      roles,
      connectedAt: new Date(),
      rooms: new Set(),
    };

    // Store in socket.data for type safety
    socket.data = socketData;

    // Audit log successful connection
    logger.info("[Socket] Authenticated connection", {
      userId: user.id,
      ip,
      durationMs: Date.now() - startTime,
    });

    next();
  } catch (error) {
    logger.error("[Socket] Auth middleware error", {
      ip,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    next(new Error("authentication_failed"));
  }
}

/**
 * Require admin role middleware
 * Use this for admin-only socket events
 */
export function requireSocketAdmin(socket: Socket): boolean {
  const data = socket.data as SocketData | undefined;
  return data?.roles?.includes("admin") ?? false;
}
