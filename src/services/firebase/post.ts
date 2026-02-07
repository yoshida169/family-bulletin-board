import firestore from '@react-native-firebase/firestore';
import { Collections } from './config';
import type { Post, CreatePostInput, UpdatePostInput } from '@/src/types/post';

const POSTS_PER_PAGE = 20;

export const postService = {
  /**
   * Create a new post
   */
  createPost: async (input: CreatePostInput): Promise<Post> => {
    const postRef = firestore()
      .collection(Collections.FAMILIES)
      .doc(input.familyId)
      .collection(Collections.POSTS)
      .doc();

    const now = firestore.FieldValue.serverTimestamp();

    const postData = {
      id: postRef.id,
      familyId: input.familyId,
      content: input.content,
      imageUrls: input.imageUrls ?? [],
      authorId: input.authorId,
      authorName: input.authorName,
      authorPhotoURL: input.authorPhotoURL ?? null,
      isPinned: false,
      commentCount: 0,
      readBy: [input.authorId],
      createdAt: now,
      updatedAt: now,
    };

    const batch = firestore().batch();

    batch.set(postRef, postData);

    // Increment post count on family
    const familyRef = firestore()
      .collection(Collections.FAMILIES)
      .doc(input.familyId);
    batch.update(familyRef, {
      postCount: firestore.FieldValue.increment(1),
      updatedAt: now,
    });

    await batch.commit();

    return {
      ...postData,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Post;
  },

  /**
   * Get a post by ID
   */
  getPost: async (familyId: string, postId: string): Promise<Post | null> => {
    const doc = await firestore()
      .collection(Collections.FAMILIES)
      .doc(familyId)
      .collection(Collections.POSTS)
      .doc(postId)
      .get();

    if (!doc.exists()) return null;

    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: data?.createdAt?.toDate() ?? new Date(),
      updatedAt: data?.updatedAt?.toDate() ?? new Date(),
    } as Post;
  },

  /**
   * Get posts for a family with pagination
   */
  getFamilyPosts: async (
    familyId: string,
    lastPostDate?: Date
  ): Promise<Post[]> => {
    let query = firestore()
      .collection(Collections.FAMILIES)
      .doc(familyId)
      .collection(Collections.POSTS)
      .orderBy('isPinned', 'desc')
      .orderBy('createdAt', 'desc')
      .limit(POSTS_PER_PAGE);

    if (lastPostDate) {
      query = query.startAfter(lastPostDate);
    }

    const snapshot = await query.get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() ?? new Date(),
        updatedAt: data.updatedAt?.toDate() ?? new Date(),
      } as Post;
    });
  },

  /**
   * Update a post
   */
  updatePost: async (
    familyId: string,
    postId: string,
    updates: UpdatePostInput
  ): Promise<void> => {
    const updateData: Record<string, unknown> = {
      ...updates,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };

    await firestore()
      .collection(Collections.FAMILIES)
      .doc(familyId)
      .collection(Collections.POSTS)
      .doc(postId)
      .update(updateData);
  },

  /**
   * Delete a post
   */
  deletePost: async (familyId: string, postId: string): Promise<void> => {
    const batch = firestore().batch();

    // Delete the post
    const postRef = firestore()
      .collection(Collections.FAMILIES)
      .doc(familyId)
      .collection(Collections.POSTS)
      .doc(postId);
    batch.delete(postRef);

    // Decrement post count on family
    const familyRef = firestore()
      .collection(Collections.FAMILIES)
      .doc(familyId);
    batch.update(familyRef, {
      postCount: firestore.FieldValue.increment(-1),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    await batch.commit();
  },

  /**
   * Mark a post as read by a user
   */
  markAsRead: async (
    familyId: string,
    postId: string,
    userId: string
  ): Promise<void> => {
    await firestore()
      .collection(Collections.FAMILIES)
      .doc(familyId)
      .collection(Collections.POSTS)
      .doc(postId)
      .update({
        readBy: firestore.FieldValue.arrayUnion(userId),
      });
  },

  /**
   * Toggle pin status of a post
   */
  togglePin: async (
    familyId: string,
    postId: string,
    isPinned: boolean
  ): Promise<void> => {
    await firestore()
      .collection(Collections.FAMILIES)
      .doc(familyId)
      .collection(Collections.POSTS)
      .doc(postId)
      .update({
        isPinned,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
  },

  /**
   * Get unread post count for a user in a family
   */
  getUnreadCount: async (
    familyId: string,
    userId: string
  ): Promise<number> => {
    const snapshot = await firestore()
      .collection(Collections.FAMILIES)
      .doc(familyId)
      .collection(Collections.POSTS)
      .where('readBy', 'not-in', [[userId]])
      .get();

    // Filter manually since Firestore doesn't support "not contains" directly
    return snapshot.docs.filter((doc) => {
      const data = doc.data();
      return !data.readBy?.includes(userId);
    }).length;
  },

  /**
   * Subscribe to posts for a family (realtime)
   */
  subscribeToFamilyPosts: (
    familyId: string,
    callback: (posts: Post[]) => void
  ): (() => void) => {
    return firestore()
      .collection(Collections.FAMILIES)
      .doc(familyId)
      .collection(Collections.POSTS)
      .orderBy('isPinned', 'desc')
      .orderBy('createdAt', 'desc')
      .limit(POSTS_PER_PAGE)
      .onSnapshot((snapshot) => {
        const posts = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            createdAt: data.createdAt?.toDate() ?? new Date(),
            updatedAt: data.updatedAt?.toDate() ?? new Date(),
          } as Post;
        });
        callback(posts);
      });
  },
};
