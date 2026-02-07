export interface Post {
  id: string;
  familyId: string;
  content: string;
  imageUrls: string[];
  authorId: string;
  authorName: string;
  authorPhotoURL: string | null;
  isPinned: boolean;
  commentCount: number;
  readBy: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  postId: string;
  familyId: string;
  content: string;
  imageUrl: string | null;
  authorId: string;
  authorName: string;
  authorPhotoURL: string | null;
  parentCommentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePostInput {
  familyId: string;
  content: string;
  imageUrls?: string[];
  authorId: string;
  authorName: string;
  authorPhotoURL?: string | null;
}

export interface UpdatePostInput {
  content?: string;
  imageUrls?: string[];
  isPinned?: boolean;
}

export interface CreateCommentInput {
  postId: string;
  familyId: string;
  content: string;
  imageUrl?: string | null;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string | null;
  parentCommentId?: string | null;
}
