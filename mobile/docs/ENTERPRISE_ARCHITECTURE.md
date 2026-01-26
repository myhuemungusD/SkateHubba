# SkateHubba Mobile - Enterprise Delivery Architecture

**Version:** 1.0
**Date:** 2026-01-26
**Author:** Senior Mobile Engineering Team

---

## Table of Contents

1. [Gap-to-Plan Mapping](#1-gap-to-plan-mapping)
2. [Technical Design (Milestones 1-4)](#2-technical-design-milestones-1-4)
3. [Data Model & State Machine](#3-data-model--state-machine)
4. [Task Breakdown](#4-task-breakdown)
5. [Risk Register](#5-risk-register)
6. [Definition of Done](#6-definition-of-done)

---

## 1. Gap-to-Plan Mapping

### Critical Gaps → Milestone Assignment

| Gap | Current State | Target State | Milestone |
|-----|---------------|--------------|-----------|
| Video upload reliability | Basic upload, no retries | Resumable upload with progress, retries, persistence | M1 |
| Client-side validation | Duration enforced client-side only | Client validation + server enforcement | M1, M2 |
| Server-side 15s enforcement | Exists (14.5-15.5s) but no state machine | Full validation with state transitions | M2 |
| Push notifications (FCM) | Not implemented | Token collection, deep linking, all notification types | M3 |
| Firestore security rules | Rules exist but permissive | Mobile-specific rules with field-level access | M4 |
| Rate limiting | Express middleware only | Function-level + Firestore counter-based limiting | M4 |
| Error tracking | Not implemented | Sentry integration with error boundaries | M1-M4 |
| Settings screen | Missing | Full settings with logout, prefs, privacy policy | M5 |
| Challenge playback | Missing | Video playback for own/opponent clips | M6 |
| Voting/judging | Missing | Complete voting UX with data model | M6 |
| Activity feed | Missing | Notifications history + recent activity | M6 |
| Spot details/add spot | Missing | Spot detail view + submission flow | M6 |
| Offline support | Not implemented | React Query persistence + offline states | M7 |
| Pull-to-refresh | Missing | All list screens | M7 |
| Skeleton loaders | Missing | Loading states for all screens | M7 |
| Deep linking | Not implemented | Universal links for challenges, profiles, spots | M7 |
| App icons/splash | Expo defaults | Custom branded assets | M7 |
| E2E test coverage | Smoke test only | Full flow coverage | M8 |
| Unit tests | None | Core logic coverage | M8 |
| CI/CD pipeline | None | Lint, typecheck, test, build, release | M8 |

---

## 2. Technical Design (Milestones 1-4)

### 2.1 Milestone 1: Core Video Upload

#### Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Camera UI     │────▶│  Upload Service  │────▶│ Firebase Storage│
│  (Expo Camera)  │     │  (Resumable)     │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │                         │
                               ▼                         ▼
                        ┌──────────────┐         ┌──────────────┐
                        │ AsyncStorage │         │ Cloud Trigger│
                        │ (Persistence)│         │ (Validation) │
                        └──────────────┘         └──────────────┘
```

#### Data Model Changes

```typescript
// New: Upload task persistence
interface PendingUpload {
  id: string;
  challengeId: string;
  localUri: string;
  storagePath: string;
  bytesTransferred: number;
  totalBytes: number;
  status: 'pending' | 'uploading' | 'paused' | 'completed' | 'failed';
  retryCount: number;
  createdAt: number;
  lastAttemptAt: number;
  error?: string;
}

// Enhanced Challenge clip
interface ChallengeClip {
  userId: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number;
  uploadedAt: Timestamp;
  status: 'pending_upload' | 'processing' | 'ready' | 'rejected';
  rejectionReason?: string;
}
```

#### Storage Paths

```
challenges/
  {challengeId}/
    {userId}/
      video.mp4           # Main video file
      thumbnail.jpg       # Generated thumbnail (if implemented)
      metadata.json       # Upload metadata
```

#### Upload Service Implementation

```typescript
// services/upload/videoUploadService.ts
export class VideoUploadService {
  private uploadTasks: Map<string, UploadTask> = new Map();

  async uploadVideo(params: {
    challengeId: string;
    localUri: string;
    onProgress: (progress: number) => void;
    onStateChange: (state: UploadState) => void;
  }): Promise<string>;

  async pauseUpload(uploadId: string): Promise<void>;
  async resumeUpload(uploadId: string): Promise<void>;
  async cancelUpload(uploadId: string): Promise<void>;
  async retryUpload(uploadId: string): Promise<void>;

  // Persistence
  async persistPendingUploads(): Promise<void>;
  async restorePendingUploads(): Promise<PendingUpload[]>;
}
```

#### Client-Side Validation

```typescript
// validators/videoValidator.ts
export interface VideoValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata: {
    duration: number;
    fileSize: number;
    codec?: string;
    resolution?: { width: number; height: number };
  };
}

export async function validateVideo(uri: string): Promise<VideoValidationResult> {
  const MAX_DURATION = 15; // seconds
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  const ALLOWED_TYPES = ['video/mp4', 'video/quicktime'];
  // Implementation...
}
```

#### Error Handling Strategy

| Error Type | User Message | Action |
|------------|--------------|--------|
| Network timeout | "Upload paused. Tap to retry." | Auto-retry with backoff |
| Storage quota exceeded | "Storage full. Please free up space." | Block upload |
| Invalid video format | "Please record in MP4 format." | Block upload |
| Duration exceeded | "Video must be 15 seconds or less." | Block upload |
| Server error (5xx) | "Server busy. Retrying..." | Auto-retry (3x) |

---

### 2.2 Milestone 2: Server-Side Video Validation

#### Cloud Function Trigger

```typescript
// functions/src/video/validateChallengeVideo.ts
export const validateChallengeVideo = functions.storage
  .object()
  .onFinalize(async (object) => {
    // 1. Extract metadata
    // 2. Validate duration (14.5-15.5s tolerance)
    // 3. Validate file type and size
    // 4. Update Firestore state machine
    // 5. Clean up invalid uploads
  });
```

#### State Machine

```
                    ┌──────────────┐
                    │   CREATED    │
                    └──────┬───────┘
                           │ User starts recording
                           ▼
                    ┌──────────────┐
                    │ PENDING_CLIP │
                    └──────┬───────┘
                           │ Upload begins
                           ▼
                    ┌──────────────┐
                    │  UPLOADING   │
                    └──────┬───────┘
                           │ Upload completes
                           ▼
                    ┌──────────────┐
        ┌───────────│  PROCESSING  │───────────┐
        │ Invalid   └──────────────┘  Valid    │
        ▼                                      ▼
┌──────────────┐                      ┌──────────────┐
│   REJECTED   │                      │    READY     │
└──────────────┘                      └──────────────┘
```

#### Firestore Update Logic

```typescript
// State transition validation
const VALID_TRANSITIONS: Record<ChallengeStatus, ChallengeStatus[]> = {
  'created': ['pending_clip'],
  'pending_clip': ['uploading'],
  'uploading': ['processing'],
  'processing': ['ready', 'rejected'],
  'ready': ['voting', 'completed'],
  'rejected': ['pending_clip'], // Allow retry
  'voting': ['completed'],
  'completed': [],
};

async function updateChallengeStatus(
  challengeId: string,
  newStatus: ChallengeStatus,
  metadata?: Record<string, unknown>
): Promise<void> {
  await db.runTransaction(async (tx) => {
    const doc = await tx.get(challengesRef.doc(challengeId));
    const current = doc.data()?.status;

    if (!VALID_TRANSITIONS[current]?.includes(newStatus)) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        `Invalid transition: ${current} -> ${newStatus}`
      );
    }

    tx.update(challengesRef.doc(challengeId), {
      status: newStatus,
      updatedAt: FieldValue.serverTimestamp(),
      ...metadata,
    });
  });
}
```

#### Validation Rules

| Check | Threshold | Action on Failure |
|-------|-----------|-------------------|
| Duration | 14.5s - 15.5s | Reject, delete file |
| File size | Max 100MB | Reject, delete file |
| Content type | video/mp4, video/quicktime | Reject, delete file |
| Corruption | FFprobe readable | Reject, delete file |

---

### 2.3 Milestone 3: Push Notifications (FCM)

#### Token Collection Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   App Start │────▶│ Request Perm │────▶│ Get Token   │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                │
                           ┌────────────────────┘
                           ▼
                    ┌──────────────┐
                    │  Firestore   │
                    │ users/{uid}/ │
                    │ fcmTokens[]  │
                    └──────────────┘
```

#### Data Model

```typescript
// User document extension
interface UserFCMData {
  fcmTokens: FCMToken[];
  notificationPreferences: NotificationPreferences;
}

interface FCMToken {
  token: string;
  platform: 'ios' | 'android';
  deviceId: string;
  createdAt: Timestamp;
  lastRefreshed: Timestamp;
}

interface NotificationPreferences {
  challengeReceived: boolean;
  opponentUploaded: boolean;
  votingRequested: boolean;
  resultPosted: boolean;
  newFollower: boolean;
  spotNearby: boolean;
}
```

#### Notification Types & Payloads

| Type | Trigger | Deep Link |
|------|---------|-----------|
| `challenge_received` | New challenge created | `/challenge/{id}` |
| `opponent_uploaded` | Opponent submits clip | `/challenge/{id}/playback` |
| `voting_requested` | Both clips ready | `/challenge/{id}/vote` |
| `result_posted` | Winner determined | `/challenge/{id}/result` |
| `new_follower` | User followed | `/profile/{uid}` |
| `spot_nearby` | Geofence trigger | `/spots/{id}` |

#### Cloud Function: Send Notification

```typescript
// functions/src/notifications/sendPushNotification.ts
interface SendNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, string>;
}

export async function sendPushNotification(params: SendNotificationParams): Promise<void> {
  const user = await db.doc(`users/${params.userId}`).get();
  const tokens = user.data()?.fcmTokens?.map(t => t.token) ?? [];

  if (tokens.length === 0) return;

  const message: admin.messaging.MulticastMessage = {
    tokens,
    notification: {
      title: params.title,
      body: params.body,
    },
    data: {
      type: params.type,
      ...params.data,
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
        },
      },
    },
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        channelId: 'challenges',
      },
    },
  };

  const response = await admin.messaging().sendEachForMulticast(message);

  // Clean up invalid tokens
  const invalidTokens = response.responses
    .map((r, i) => r.success ? null : tokens[i])
    .filter(Boolean);

  if (invalidTokens.length > 0) {
    await cleanupInvalidTokens(params.userId, invalidTokens);
  }
}
```

---

### 2.4 Milestone 4: Security Rules + Rate Limiting

#### Firestore Security Rules (Mobile-Specific)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    function isParticipant(challenge) {
      return request.auth.uid in challenge.participants;
    }

    function isValidTimestamp(ts) {
      return ts == request.time;
    }

    function hasRequiredFields(fields) {
      return request.resource.data.keys().hasAll(fields);
    }

    // Rate limiting helper (checks counter document)
    function isUnderRateLimit(collection, limit, windowSeconds) {
      let counter = get(/databases/$(database)/documents/rateLimits/$(request.auth.uid)/$(collection)/counter);
      let windowStart = request.time - duration.value(windowSeconds, 's');
      return counter == null || counter.data.count < limit || counter.data.lastReset < windowStart;
    }

    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isOwner(userId) && hasRequiredFields(['email', 'createdAt']);
      allow update: if isOwner(userId) &&
        !request.resource.data.diff(resource.data).affectedKeys().hasAny([
          'trustLevel', 'isBanned', 'isVerified', 'role'
        ]);
      allow delete: if false; // Never allow client deletion

      // FCM tokens subcollection
      match /fcmTokens/{tokenId} {
        allow read, write: if isOwner(userId);
      }
    }

    // Challenges collection
    match /challenges/{challengeId} {
      allow read: if isAuthenticated() && isParticipant(resource.data);
      allow create: if isAuthenticated() &&
        request.auth.uid == request.resource.data.createdBy &&
        request.resource.data.participants.hasAll([request.auth.uid]) &&
        isUnderRateLimit('challenges', 10, 3600); // 10 per hour
      allow update: if isAuthenticated() && isParticipant(resource.data) &&
        validateChallengeUpdate();
      allow delete: if false;

      // Challenge clips subcollection
      match /clips/{clipId} {
        allow read: if isAuthenticated() && isParticipant(get(/databases/$(database)/documents/challenges/$(challengeId)).data);
        allow create: if isAuthenticated() &&
          request.auth.uid == request.resource.data.userId &&
          isParticipant(get(/databases/$(database)/documents/challenges/$(challengeId)).data);
        allow update: if false; // Server-only updates
      }

      // Challenge votes subcollection
      match /votes/{voteId} {
        allow read: if isAuthenticated();
        allow create: if isAuthenticated() &&
          request.auth.uid == voteId && // One vote per user
          !isParticipant(get(/databases/$(database)/documents/challenges/$(challengeId)).data); // Can't vote on own challenge
        allow update, delete: if false;
      }
    }

    // Spots collection
    match /spots/{spotId} {
      allow read: if true; // Public read
      allow create: if isAuthenticated() && isUnderRateLimit('spots', 5, 86400); // 5 per day
      allow update: if isAuthenticated() && resource.data.createdBy == request.auth.uid;
      allow delete: if false;
    }

    // Rate limit counters (server-managed)
    match /rateLimits/{userId}/{collection}/{document} {
      allow read: if isOwner(userId);
      allow write: if false; // Server-only
    }
  }
}

function validateChallengeUpdate() {
  let allowedFields = ['status', 'updatedAt'];
  let changedFields = request.resource.data.diff(resource.data).affectedKeys();
  return changedFields.hasOnly(allowedFields);
}
```

#### Storage Security Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    function isValidVideo() {
      return request.resource.contentType.matches('video/.*') &&
             request.resource.size < 100 * 1024 * 1024; // 100MB max
    }

    function isValidImage() {
      return request.resource.contentType.matches('image/.*') &&
             request.resource.size < 10 * 1024 * 1024; // 10MB max
    }

    // Challenge videos
    match /challenges/{challengeId}/{userId}/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() &&
                   isOwner(userId) &&
                   isValidVideo();
      allow delete: if false; // Server-only deletion
    }

    // Profile images
    match /profiles/{userId}/{fileName} {
      allow read: if true;
      allow write: if isOwner(userId) && isValidImage();
    }

    // Spot images
    match /spots/{spotId}/{fileName} {
      allow read: if true;
      allow create: if isAuthenticated() && isValidImage();
      allow update, delete: if false;
    }
  }
}
```

#### Rate Limiting Cloud Function

```typescript
// functions/src/security/rateLimiter.ts
interface RateLimitConfig {
  collection: string;
  maxRequests: number;
  windowSeconds: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  challengeCreate: { collection: 'challenges', maxRequests: 10, windowSeconds: 3600 },
  videoUpload: { collection: 'uploads', maxRequests: 20, windowSeconds: 3600 },
  spotCreate: { collection: 'spots', maxRequests: 5, windowSeconds: 86400 },
};

export async function checkRateLimit(
  userId: string,
  action: keyof typeof RATE_LIMITS
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const config = RATE_LIMITS[action];
  const counterRef = db.doc(`rateLimits/${userId}/${config.collection}/counter`);

  return db.runTransaction(async (tx) => {
    const doc = await tx.get(counterRef);
    const now = Date.now();
    const windowStart = now - (config.windowSeconds * 1000);

    let count = 0;
    let lastReset = now;

    if (doc.exists) {
      const data = doc.data()!;
      if (data.lastReset > windowStart) {
        count = data.count;
        lastReset = data.lastReset;
      }
    }

    if (count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(lastReset + (config.windowSeconds * 1000)),
      };
    }

    tx.set(counterRef, {
      count: count + 1,
      lastReset: count === 0 ? now : lastReset,
      updatedAt: now,
    });

    return {
      allowed: true,
      remaining: config.maxRequests - count - 1,
      resetAt: new Date(lastReset + (config.windowSeconds * 1000)),
    };
  });
}
```

---

## 3. Data Model & State Machine

### Challenge Lifecycle

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CHALLENGE LIFECYCLE                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Creator                          Opponent                          │
│  ───────                          ────────                          │
│     │                                │                              │
│     │  1. Create Challenge           │                              │
│     │─────────────────────────────▶  │                              │
│     │     [status: CREATED]          │                              │
│     │                                │                              │
│     │  2. Record & Upload            │                              │
│     │     [status: UPLOADING]        │                              │
│     │                                │                              │
│     │  3. Server Validates           │                              │
│     │     [status: CREATOR_READY]    │                              │
│     │                                │                              │
│     │  4. Push Notification ────────▶│                              │
│     │                                │                              │
│     │                                │  5. Accept & Record          │
│     │                                │     [status: UPLOADING]      │
│     │                                │                              │
│     │                                │  6. Server Validates         │
│     │                                │     [status: BOTH_READY]     │
│     │                                │                              │
│     │◀─────── 7. Push Notification ──│                              │
│     │                                │                              │
│     │         8. VOTING PHASE                                       │
│     │         [status: VOTING]                                      │
│     │                                │                              │
│     │         9. Results Posted                                     │
│     │         [status: COMPLETED]                                   │
│     │                                │                              │
└─────────────────────────────────────────────────────────────────────┘
```

### Firestore Collections Schema

```typescript
// /challenges/{challengeId}
interface Challenge {
  id: string;
  createdBy: string;
  opponent: string;
  participants: string[]; // [createdBy, opponent]

  status: ChallengeStatus;

  rules: {
    maxDuration: number; // 15 seconds
    trick?: string;
    spotId?: string;
  };

  clips: {
    [userId: string]: ChallengeClip;
  };

  voting: {
    deadline: Timestamp;
    votes: {
      [oderId: string]: string; // oderId -> odedUserId
    };
    result?: {
      winner: string;
      creatorVotes: number;
      opponentVotes: number;
    };
  };

  deadline: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

type ChallengeStatus =
  | 'created'           // Challenge created, waiting for creator clip
  | 'creator_uploading' // Creator uploading
  | 'creator_ready'     // Creator clip validated
  | 'opponent_uploading'// Opponent uploading
  | 'both_ready'        // Both clips validated
  | 'voting'            // Voting period active
  | 'completed'         // Winner determined
  | 'expired'           // Deadline passed without completion
  | 'cancelled';        // Cancelled by participant

// /users/{userId}
interface User {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;

  stats: {
    points: number;
    wins: number;
    losses: number;
    streak: number;
    spotsUnlocked: number;
  };

  fcmTokens: FCMToken[];
  notificationPreferences: NotificationPreferences;

  trustLevel: number; // Server-managed
  isBanned: boolean;  // Server-managed
  isVerified: boolean;// Server-managed

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// /spots/{spotId}
interface Spot {
  id: string;
  name: string;
  description: string;

  location: {
    lat: number;
    lng: number;
    address?: string;
  };

  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'pro';
  tags: string[];

  images: string[];

  stats: {
    checkInCount: number;
    challengeCount: number;
    rating: number;
    ratingCount: number;
  };

  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// /activity/{activityId}
interface ActivityItem {
  id: string;
  userId: string;
  type: ActivityType;

  data: {
    challengeId?: string;
    spotId?: string;
    opponentId?: string;
    result?: 'win' | 'loss';
  };

  read: boolean;
  createdAt: Timestamp;
}

type ActivityType =
  | 'challenge_received'
  | 'challenge_accepted'
  | 'opponent_uploaded'
  | 'voting_started'
  | 'challenge_won'
  | 'challenge_lost'
  | 'new_follower'
  | 'spot_unlocked';
```

---

## 4. Task Breakdown

### Milestone 1: Core Video Upload (Est: 13 points)

| Task | Points | Dependencies |
|------|--------|--------------|
| Create VideoUploadService class | 3 | - |
| Implement resumable upload with Firebase Storage | 3 | VideoUploadService |
| Add progress tracking and UI updates | 2 | Resumable upload |
| Implement upload persistence with AsyncStorage | 2 | VideoUploadService |
| Add client-side validation (duration, size, type) | 2 | - |
| Integrate Sentry error tracking | 1 | - |

### Milestone 2: Server-Side Video Validation (Est: 8 points)

| Task | Points | Dependencies |
|------|--------|--------------|
| Enhance validateChallengeVideo function | 3 | - |
| Implement state machine transitions | 2 | Validation function |
| Add idempotency checks | 1 | State machine |
| Create Firestore triggers for status updates | 2 | State machine |

### Milestone 3: Push Notifications (Est: 13 points)

| Task | Points | Dependencies |
|------|--------|--------------|
| Set up expo-notifications | 2 | - |
| Implement FCM token collection and refresh | 3 | expo-notifications |
| Create token storage in Firestore | 1 | Token collection |
| Build sendPushNotification Cloud Function | 3 | - |
| Implement notification triggers for all types | 2 | Send function |
| Add deep linking handler in app | 2 | expo-notifications |

### Milestone 4: Security Rules + Rate Limiting (Est: 8 points)

| Task | Points | Dependencies |
|------|--------|--------------|
| Write comprehensive Firestore rules | 3 | - |
| Write Storage security rules | 2 | - |
| Implement rate limiting Cloud Function | 2 | - |
| Add emulator tests for rules | 1 | All rules |

### Milestone 5: Settings + Privacy Policy (Est: 5 points)

| Task | Points | Dependencies |
|------|--------|--------------|
| Create Settings screen UI | 2 | - |
| Implement logout with state cleanup | 1 | - |
| Add notification preferences | 1 | M3 |
| Create Privacy Policy screen | 1 | - |

### Milestone 6: Challenge Flow Completion (Est: 13 points)

| Task | Points | Dependencies |
|------|--------|--------------|
| Build video playback component | 2 | - |
| Create challenge detail screen | 3 | Playback component |
| Implement voting UI and logic | 3 | Challenge detail |
| Build activity feed screen | 2 | - |
| Create spot details screen | 2 | - |
| Implement add new spot flow | 1 | Spot details |

### Milestone 7: Offline + UX Polish (Est: 10 points)

| Task | Points | Dependencies |
|------|--------|--------------|
| Set up React Query persistence | 2 | - |
| Add offline state indicators | 2 | Persistence |
| Implement pull-to-refresh on all lists | 1 | - |
| Create skeleton loader components | 2 | - |
| Configure deep linking with Expo Router | 2 | - |
| Create custom app icons and splash screen | 1 | - |

### Milestone 8: Testing + CI/CD (Est: 10 points)

| Task | Points | Dependencies |
|------|--------|--------------|
| Expand Detox E2E test coverage | 3 | All features |
| Write unit tests for services | 2 | - |
| Write unit tests for validators | 1 | - |
| Set up GitHub Actions CI pipeline | 2 | - |
| Configure EAS Build integration | 1 | CI pipeline |
| Create release versioning strategy | 1 | CI pipeline |

**Total Estimated Points: 80**

---

## 5. Risk Register

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|------------|--------|------------|
| 1 | **Video upload fails on poor network** | High | High | Implement chunked resumable uploads, aggressive retry with exponential backoff, background upload persistence |
| 2 | **FCM tokens become stale** | Medium | Medium | Refresh tokens on app launch, clean up invalid tokens on send failure, use topic subscriptions as fallback |
| 3 | **Rate limiting bypassed via multiple accounts** | Medium | High | Implement device fingerprinting, IP-based secondary limits, require email verification before challenge creation |
| 4 | **Large video files cause OOM on low-end devices** | Medium | Medium | Implement streaming upload, avoid loading full file into memory, add device capability checks |
| 5 | **Firestore rules too permissive allows data leakage** | Low | Critical | Comprehensive emulator testing, security audit checklist, principle of least privilege, regular rule reviews |

### Contingency Plans

1. **Video Upload Failures**: Fall back to direct Storage SDK upload if resumable fails; queue uploads for later if network completely unavailable
2. **Push Notification Delivery Issues**: Implement in-app notification center as fallback; use polling for critical updates
3. **Rate Limit Gaming**: Implement progressive trust levels; require phone verification for high-volume users
4. **Memory Issues**: Implement video compression before upload; provide quality options to users
5. **Security Breaches**: Incident response plan with immediate rule lockdown capabilities; audit logging for all sensitive operations

---

## 6. Definition of Done

### Per-Feature Checklist

- [ ] Code compiles without TypeScript errors
- [ ] No `any` types (except explicit escape hatches with justification)
- [ ] Unit tests written and passing (>80% coverage for new code)
- [ ] Integration tests for API interactions
- [ ] E2E test for user-facing flows
- [ ] Error states handled with user-friendly messages
- [ ] Loading states implemented
- [ ] Offline behavior tested and documented
- [ ] Accessibility: minimum 44px touch targets, screen reader labels
- [ ] Analytics events logged for key actions
- [ ] Errors captured in Sentry with context
- [ ] Code reviewed by peer
- [ ] Documentation updated (if applicable)

### Per-Milestone Acceptance Criteria

#### Milestone 1: Core Video Upload
- [ ] Video uploads successfully to Firebase Storage
- [ ] Progress indicator shows accurate percentage
- [ ] Upload survives app backgrounding
- [ ] Failed uploads can be retried
- [ ] Client validation prevents invalid uploads
- [ ] Errors are user-friendly and logged to Sentry

#### Milestone 2: Server-Side Validation
- [ ] Videos > 15s are rejected server-side
- [ ] Invalid videos are deleted from Storage
- [ ] Firestore status updates correctly
- [ ] Client receives status updates in real-time
- [ ] Idempotent processing (re-triggers don't duplicate work)

#### Milestone 3: Push Notifications
- [ ] FCM tokens collected on app launch
- [ ] Tokens refresh correctly
- [ ] All notification types send successfully
- [ ] Deep links open correct screens
- [ ] Invalid tokens are cleaned up
- [ ] Notification preferences respected

#### Milestone 4: Security + Rate Limiting
- [ ] Firestore rules block unauthorized access
- [ ] Storage rules enforce ownership
- [ ] Rate limits prevent abuse
- [ ] Emulator tests validate rules
- [ ] No security regressions in existing features

#### Milestone 5: Settings + Privacy
- [ ] Logout clears all auth state and caches
- [ ] Notification preferences persist
- [ ] Privacy policy displays correctly
- [ ] Settings accessible from profile

#### Milestone 6: Challenge Flow
- [ ] Videos play smoothly
- [ ] Both clips viewable
- [ ] Voting works correctly
- [ ] Activity feed shows history
- [ ] Spot details display correctly
- [ ] New spots can be submitted

#### Milestone 7: Offline + Polish
- [ ] App works offline with cached data
- [ ] Pull-to-refresh on all lists
- [ ] Skeleton loaders during loading
- [ ] Deep links work from external sources
- [ ] Custom icons and splash screen

#### Milestone 8: Testing + CI/CD
- [ ] E2E tests cover critical flows
- [ ] Unit tests for core logic
- [ ] CI runs on every PR
- [ ] Builds succeed for iOS and Android
- [ ] Version bumping automated

---

## Test Plan

### Unit Tests

| Module | Test Cases |
|--------|------------|
| `VideoUploadService` | Upload success, retry logic, pause/resume, persistence |
| `videoValidator` | Valid video, oversized, wrong format, too long |
| `rateLimiter` | Under limit, at limit, reset behavior |
| `authStore` | Sign in, sign out, state persistence |
| `notificationHandler` | Deep link parsing, preference filtering |

### Integration Tests

| Flow | Test Cases |
|------|------------|
| Challenge Creation | Record → Upload → Validate → Status update |
| Push Notifications | Token save → Notification send → Receive → Deep link |
| Voting | Both ready → Vote cast → Winner determined |

### E2E Tests (Detox)

| Flow | Steps |
|------|-------|
| Onboarding | Launch → Sign up → Complete profile |
| Create Challenge | Home → Find user → Challenge → Record → Upload → Confirm |
| Respond to Challenge | Notification → Open → Accept → Record → Upload |
| Vote on Challenge | Open challenge → View clips → Cast vote |
| View Results | Open completed challenge → See winner → Stats updated |

---

## Appendix: File Structure (Proposed)

```
mobile/
├── app/
│   ├── (tabs)/
│   │   └── settings.tsx         # NEW: Settings screen
│   ├── challenge/
│   │   ├── [id].tsx             # NEW: Challenge detail/playback
│   │   ├── [id]/vote.tsx        # NEW: Voting screen
│   │   └── new.tsx              # ENHANCED: Upload service
│   ├── spots/
│   │   ├── [id].tsx             # NEW: Spot details
│   │   └── new.tsx              # NEW: Add spot
│   ├── activity/
│   │   └── index.tsx            # NEW: Activity feed
│   └── privacy-policy.tsx       # NEW: Privacy policy
├── src/
│   ├── services/
│   │   ├── upload/
│   │   │   ├── VideoUploadService.ts    # NEW
│   │   │   └── uploadPersistence.ts     # NEW
│   │   ├── notifications/
│   │   │   ├── fcmService.ts            # NEW
│   │   │   └── notificationHandler.ts   # NEW
│   │   └── offline/
│   │       └── offlineManager.ts        # NEW
│   ├── validators/
│   │   └── videoValidator.ts            # NEW
│   ├── components/
│   │   ├── VideoPlayer.tsx              # NEW
│   │   ├── SkeletonLoader.tsx           # NEW
│   │   └── OfflineIndicator.tsx         # NEW
│   └── hooks/
│       ├── useUpload.ts                 # NEW
│       ├── useNotifications.ts          # NEW
│       └── useOffline.ts                # NEW
├── functions/
│   └── src/
│       ├── video/
│       │   └── validateChallengeVideo.ts # ENHANCED
│       ├── notifications/
│       │   └── sendPushNotification.ts   # NEW
│       └── security/
│           └── rateLimiter.ts            # NEW
└── docs/
    └── ENTERPRISE_ARCHITECTURE.md        # THIS FILE
```

---

*Document maintained by the Mobile Engineering Team. Last updated: 2026-01-26*
