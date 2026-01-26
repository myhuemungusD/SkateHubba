/**
 * Push Notification Types
 * FCM token management and notification handling
 */

export type NotificationType =
  | 'challenge_received'
  | 'opponent_uploaded'
  | 'voting_requested'
  | 'result_posted'
  | 'new_follower'
  | 'spot_nearby';

export interface FCMToken {
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId: string;
  createdAt: Date;
  lastRefreshed: Date;
}

export interface NotificationPreferences {
  challengeReceived: boolean;
  opponentUploaded: boolean;
  votingRequested: boolean;
  resultPosted: boolean;
  newFollower: boolean;
  spotNearby: boolean;
  // Master switch
  enabled: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  challengeReceived: true,
  opponentUploaded: true,
  votingRequested: true,
  resultPosted: true,
  newFollower: true,
  spotNearby: false, // Off by default due to battery usage
  enabled: true,
};

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  data: NotificationData;
}

export interface NotificationData {
  type: NotificationType;
  challengeId?: string;
  opponentId?: string;
  spotId?: string;
  userId?: string;
  screen?: string; // Deep link target
  timestamp?: string;
}

export interface ReceivedNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: NotificationData;
  receivedAt: Date;
  read: boolean;
  tapped: boolean;
}

// Deep link mapping for notification types
export const NOTIFICATION_DEEP_LINKS: Record<NotificationType, string> = {
  challenge_received: '/challenge/[id]',
  opponent_uploaded: '/challenge/[id]/playback',
  voting_requested: '/challenge/[id]/vote',
  result_posted: '/challenge/[id]/result',
  new_follower: '/profile/[uid]',
  spot_nearby: '/spots/[id]',
};

// User-friendly notification titles by type
export const NOTIFICATION_TITLES: Record<NotificationType, string> = {
  challenge_received: 'New Challenge!',
  opponent_uploaded: 'Your Opponent Responded!',
  voting_requested: 'Time to Vote!',
  result_posted: 'Challenge Results',
  new_follower: 'New Follower',
  spot_nearby: 'Spot Nearby',
};
