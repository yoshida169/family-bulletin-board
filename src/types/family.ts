export type MemberRole = 'admin' | 'member' | 'child';

export type Relation =
  | 'お父さん'
  | 'お母さん'
  | 'お兄ちゃん'
  | 'お姉ちゃん'
  | '弟'
  | '妹'
  | 'おじいちゃん'
  | 'おばあちゃん'
  | 'その他';

export interface FamilySettings {
  allowChildrenToPost: boolean;
  allowChildrenToComment: boolean;
  requireApprovalForPosts: boolean;
}

export interface Family {
  id: string;
  name: string;
  description: string | null;
  iconURL: string | null;
  ownerId: string;
  adminIds: string[];
  memberCount: number;
  postCount: number;
  settings: FamilySettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface FamilyMember {
  userId: string;
  displayName: string;
  photoURL: string | null;
  relation: Relation;
  role: MemberRole;
  joinedAt: Date;
  invitedBy: string | null;
}

export interface InviteCode {
  id: string;
  familyId: string;
  code: string;
  createdBy: string;
  expiresAt: Date;
  maxUses: number;
  usedCount: number;
  usedBy: string[];
  createdAt: Date;
  isActive: boolean;
}

export interface UserFamilyRelation {
  familyId: string;
  familyName: string;
  familyIconURL: string | null;
  role: MemberRole;
  relation: Relation;
  joinedAt: Date;
  lastViewedAt: Date;
  unreadPostCount: number;
}
