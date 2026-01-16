/**
 * Socket Event Types (Client-side)
 *
 * Mirrored from server for type safety.
 */

// ============================================================================
// Battle Events
// ============================================================================

export interface BattleCreatedPayload {
  battleId: string;
  creatorId: string;
  matchmaking: "open" | "direct";
  opponentId?: string;
  createdAt: string;
}

export interface BattleJoinedPayload {
  battleId: string;
  odv: string;
  joinedAt: string;
}

export interface BattleVotePayload {
  battleId: string;
  odv: string;
  vote: "clean" | "sketch" | "redo";
  votedAt: string;
}

export interface BattleCompletedPayload {
  battleId: string;
  winnerId?: string;
  finalScore: { [odv: string]: number };
  completedAt: string;
}

export interface BattleUpdatePayload {
  battleId: string;
  state: "waiting" | "active" | "voting" | "completed";
  currentTurn?: string;
  roundNumber?: number;
}

// ============================================================================
// S.K.A.T.E. Game Events
// ============================================================================

export interface GameCreatedPayload {
  gameId: string;
  spotId: string;
  creatorId: string;
  maxPlayers: number;
  createdAt: string;
}

export interface GameJoinedPayload {
  gameId: string;
  odv: string;
  playerCount: number;
}

export interface GameTrickPayload {
  gameId: string;
  odv: string;
  trickName: string;
  clipUrl?: string;
  sentAt: string;
}

export interface GameLetterPayload {
  gameId: string;
  odv: string;
  letters: string;
}

export interface GameTurnPayload {
  gameId: string;
  currentPlayer: string;
  action: "set" | "attempt";
  timeLimit?: number;
}

export interface GameEndedPayload {
  gameId: string;
  winnerId: string;
  finalStandings: Array<{ odv: string; letters: string }>;
}

// ============================================================================
// Notification Events
// ============================================================================

export interface NotificationPayload {
  id: string;
  type: "challenge" | "turn" | "result" | "system";
  title: string;
  message: string;
  data?: Record<string, unknown>;
  createdAt: string;
}

// ============================================================================
// Presence Events
// ============================================================================

export interface PresencePayload {
  odv: string;
  status: "online" | "away" | "offline";
  lastSeen?: string;
}

// ============================================================================
// Room Types
// ============================================================================

export type RoomType = "battle" | "game" | "spot" | "global";

// ============================================================================
// Client → Server Events
// ============================================================================

export interface ClientToServerEvents {
  "room:join": (roomType: RoomType, roomId: string) => void;
  "room:leave": (roomType: RoomType, roomId: string) => void;
  "battle:create": (data: Omit<BattleCreatedPayload, "battleId" | "createdAt">) => void;
  "battle:join": (battleId: string) => void;
  "battle:vote": (data: Omit<BattleVotePayload, "votedAt">) => void;
  "battle:ready": (battleId: string) => void;
  "game:create": (spotId: string, maxPlayers?: number) => void;
  "game:join": (gameId: string) => void;
  "game:trick": (data: Omit<GameTrickPayload, "sentAt">) => void;
  "game:pass": (gameId: string) => void;
  "presence:update": (status: "online" | "away") => void;
  typing: (roomId: string, isTyping: boolean) => void;
}

// ============================================================================
// Server → Client Events
// ============================================================================

export interface ServerToClientEvents {
  connected: (data: { userId: string; serverTime: string }) => void;
  error: (data: { code: string; message: string }) => void;
  "battle:created": (data: BattleCreatedPayload) => void;
  "battle:joined": (data: BattleJoinedPayload) => void;
  "battle:voted": (data: BattleVotePayload) => void;
  "battle:completed": (data: BattleCompletedPayload) => void;
  "battle:update": (data: BattleUpdatePayload) => void;
  "game:created": (data: GameCreatedPayload) => void;
  "game:joined": (data: GameJoinedPayload) => void;
  "game:trick": (data: GameTrickPayload) => void;
  "game:letter": (data: GameLetterPayload) => void;
  "game:turn": (data: GameTurnPayload) => void;
  "game:ended": (data: GameEndedPayload) => void;
  notification: (data: NotificationPayload) => void;
  "presence:update": (data: PresencePayload) => void;
  typing: (data: { odv: string; roomId: string; isTyping: boolean }) => void;
}
