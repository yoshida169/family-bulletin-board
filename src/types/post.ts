export interface Post {
  id: string;
  title: string;
  content: string;
  imageURLs: string[];
  authorId: string;
  authorName: string;
  authorPhotoURL: string | null;
  isPinned: boolean;
  isApproved: boolean;
  commentCount: number;
  readCount: number;
  createdAt: Date;
  updatedAt: Date;
  searchKeywords: string[];
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string | null;
  parentCommentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReadRecord {
  userId: string;
  readAt: Date;
}

export interface CreatePostInput {
  title: string;
  content: string;
  images?: string[];
}

export interface UpdatePostInput {
  title?: string;
  content?: string;
  imageURLs?: string[];
  isPinned?: boolean;
}

export interface CreateCommentInput {
  content: string;
  parentCommentId?: string;
}
