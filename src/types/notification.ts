export type NotificationType = 'new_post' | 'new_comment' | 'mention' | 'invite';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: {
    familyId?: string;
    postId?: string;
    commentId?: string;
    inviteCode?: string;
  };
  isRead: boolean;
  createdAt: Date;
}

export interface FCMToken {
  token: string;
  platform: 'ios' | 'android';
  createdAt: Date;
  lastUsedAt: Date;
}
