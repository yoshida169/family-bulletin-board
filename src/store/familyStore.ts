import { create } from 'zustand';
import type { Family, UserFamilyRelation, FamilyMember, Relation } from '@/src/types/family';
import type { Post } from '@/src/types/post';
import { familyService } from '@/src/services/firebase/family';
import { memberService } from '@/src/services/firebase/member';
import { postService } from '@/src/services/firebase/post';

interface FamilyState {
  // User's families
  userFamilies: UserFamilyRelation[];
  families: UserFamilyRelation[]; // Alias for compatibility
  isLoadingFamilies: boolean;
  isLoading: boolean; // Alias for compatibility

  // Current selected family
  currentFamily: Family | null;
  currentFamilyId: string | null;

  // Family members
  members: FamilyMember[];

  // Posts for current family
  posts: Post[];
  isLoadingPosts: boolean;
  hasMorePosts: boolean;

  // Errors
  error: string | null;
}

interface FamilyActions {
  // User families
  loadUserFamilies: (userId: string) => Promise<void>;
  clearFamilies: () => void;

  // Current family
  setCurrentFamily: (familyId: string) => Promise<void>;
  selectFamily: (familyId: string) => Promise<void>; // Alias for setCurrentFamily
  clearCurrentFamily: () => void;

  // Family CRUD
  createFamily: (input: {
    name: string;
    description?: string | null;
    ownerId: string;
    ownerName: string;
    ownerRelation: Relation;
    ownerPhotoURL?: string | null;
  }) => Promise<Family>;
  updateFamily: (
    familyId: string,
    updates: {
      name?: string;
      description?: string | null;
      iconURL?: string | null;
    }
  ) => Promise<void>;
  deleteFamily: (familyId: string) => Promise<void>;

  // Members
  loadFamilyMembers: (familyId: string) => Promise<void>;

  // Posts
  loadPosts: () => Promise<void>;
  loadMorePosts: () => Promise<void>;
  createPost: (content: string, authorId: string, authorName: string, authorPhotoURL?: string | null) => Promise<Post>;
  deletePost: (postId: string) => Promise<void>;
  markPostAsRead: (postId: string, userId: string) => Promise<void>;
  togglePostPin: (postId: string, isPinned: boolean) => Promise<void>;

  // Subscription
  subscribeToCurrentFamilyPosts: () => (() => void) | undefined;

  // Error handling
  clearError: () => void;
  setError: (error: string) => void;
  setFamilies: (families: UserFamilyRelation[]) => void;
  setMembers: (members: FamilyMember[]) => void;
}

type FamilyStore = FamilyState & FamilyActions;

export const useFamilyStore = create<FamilyStore>((set, get) => ({
  // Initial state
  userFamilies: [],
  families: [], // Alias
  isLoadingFamilies: false,
  isLoading: false, // Alias
  currentFamily: null,
  currentFamilyId: null,
  members: [],
  posts: [],
  isLoadingPosts: false,
  hasMorePosts: true,
  error: null,

  // Load user's families
  loadUserFamilies: async (userId: string) => {
    set({ isLoadingFamilies: true, isLoading: true, error: null });
    try {
      const families = await familyService.getUserFamilies(userId);
      set({
        userFamilies: families,
        families, // Alias
        isLoadingFamilies: false,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'ファミリーの読み込みに失敗しました';
      set({
        error: message,
        isLoadingFamilies: false,
        isLoading: false,
      });
      throw error;
    }
  },

  clearFamilies: () => {
    set({
      userFamilies: [],
      currentFamily: null,
      currentFamilyId: null,
      posts: [],
    });
  },

  // Set current family
  setCurrentFamily: async (familyId: string) => {
    set({ isLoadingPosts: true, error: null, currentFamilyId: familyId });
    try {
      const family = await familyService.getFamily(familyId);
      if (family) {
        set({ currentFamily: family });
        // Load posts for this family
        await get().loadPosts();
      } else {
        set({ error: 'ファミリーが見つかりません', isLoadingPosts: false });
      }
    } catch (error) {
      set({
        error: 'ファミリーの読み込みに失敗しました',
        isLoadingPosts: false,
      });
    }
  },

  clearCurrentFamily: () => {
    set({
      currentFamily: null,
      currentFamilyId: null,
      posts: [],
      hasMorePosts: true,
    });
  },

  // Load posts
  loadPosts: async () => {
    const { currentFamilyId } = get();
    if (!currentFamilyId) return;

    set({ isLoadingPosts: true, error: null });
    try {
      const posts = await postService.getFamilyPosts(currentFamilyId);
      set({
        posts,
        isLoadingPosts: false,
        hasMorePosts: posts.length >= 20,
      });
    } catch (error) {
      set({
        error: '投稿の読み込みに失敗しました',
        isLoadingPosts: false,
      });
    }
  },

  // Load more posts (pagination)
  loadMorePosts: async () => {
    const { currentFamilyId, posts, hasMorePosts, isLoadingPosts } = get();
    if (!currentFamilyId || !hasMorePosts || isLoadingPosts) return;

    const lastPost = posts[posts.length - 1];
    if (!lastPost) return;

    set({ isLoadingPosts: true });
    try {
      const morePosts = await postService.getFamilyPosts(
        currentFamilyId,
        lastPost.createdAt
      );
      set({
        posts: [...posts, ...morePosts],
        isLoadingPosts: false,
        hasMorePosts: morePosts.length >= 20,
      });
    } catch (error) {
      set({
        error: '投稿の読み込みに失敗しました',
        isLoadingPosts: false,
      });
    }
  },

  // Create a new post
  createPost: async (content: string, authorId: string, authorName: string, authorPhotoURL?: string | null) => {
    const { currentFamilyId } = get();
    if (!currentFamilyId) {
      throw new Error('ファミリーが選択されていません');
    }

    const post = await postService.createPost({
      familyId: currentFamilyId,
      content,
      authorId,
      authorName,
      authorPhotoURL,
    });

    // Add to the beginning of posts list
    set((state) => ({
      posts: [post, ...state.posts],
    }));

    return post;
  },

  // Delete a post
  deletePost: async (postId: string) => {
    const { currentFamilyId } = get();
    if (!currentFamilyId) return;

    await postService.deletePost(currentFamilyId, postId);

    // Remove from posts list
    set((state) => ({
      posts: state.posts.filter((p) => p.id !== postId),
    }));
  },

  // Mark post as read
  markPostAsRead: async (postId: string, userId: string) => {
    const { currentFamilyId, posts } = get();
    if (!currentFamilyId) return;

    await postService.markAsRead(currentFamilyId, postId, userId);

    // Update local state
    set({
      posts: posts.map((p) =>
        p.id === postId && !p.readBy.includes(userId)
          ? { ...p, readBy: [...p.readBy, userId] }
          : p
      ),
    });
  },

  // Toggle pin
  togglePostPin: async (postId: string, isPinned: boolean) => {
    const { currentFamilyId, posts } = get();
    if (!currentFamilyId) return;

    await postService.togglePin(currentFamilyId, postId, isPinned);

    // Update local state and re-sort
    const updatedPosts = posts.map((p) =>
      p.id === postId ? { ...p, isPinned } : p
    );
    updatedPosts.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
    set({ posts: updatedPosts });
  },

  // Subscribe to realtime updates
  subscribeToCurrentFamilyPosts: () => {
    const { currentFamilyId } = get();
    if (!currentFamilyId) return undefined;

    return postService.subscribeToFamilyPosts(currentFamilyId, (posts) => {
      set({ posts, hasMorePosts: posts.length >= 20 });
    });
  },

  // Alias for setCurrentFamily
  selectFamily: async (familyId: string) => {
    await get().setCurrentFamily(familyId);
    await get().loadFamilyMembers(familyId);
  },

  // Create a new family
  createFamily: async (input) => {
    set({ isLoadingFamilies: true, isLoading: true, error: null });
    try {
      const family = await familyService.createFamily(input);

      // Reload user families to include the new one
      await get().loadUserFamilies(input.ownerId);

      set({ isLoadingFamilies: false, isLoading: false });
      return family;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'ファミリーの作成に失敗しました';
      set({
        error: message,
        isLoadingFamilies: false,
        isLoading: false,
      });
      throw error;
    }
  },

  // Update family
  updateFamily: async (familyId: string, updates) => {
    set({ isLoadingFamilies: true, isLoading: true, error: null });
    try {
      await familyService.updateFamily(familyId, updates);

      // If we're updating the current family, reload it
      const { currentFamilyId } = get();
      if (currentFamilyId === familyId) {
        const family = await familyService.getFamily(familyId);
        if (family) {
          set({ currentFamily: family });
        }
      }

      set({ isLoadingFamilies: false, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'ファミリーの更新に失敗しました';
      set({
        error: message,
        isLoadingFamilies: false,
        isLoading: false,
      });
      throw error;
    }
  },

  // Delete family
  deleteFamily: async (familyId: string) => {
    set({ isLoadingFamilies: true, isLoading: true, error: null });
    try {
      await familyService.deleteFamily(familyId);

      // Clear if this was the current family
      const { currentFamilyId } = get();
      if (currentFamilyId === familyId) {
        get().clearCurrentFamily();
      }

      // Remove from user families list
      set((state) => ({
        userFamilies: state.userFamilies.filter((f) => f.familyId !== familyId),
        families: state.families.filter((f) => f.familyId !== familyId),
        isLoadingFamilies: false,
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'ファミリーの削除に失敗しました';
      set({
        error: message,
        isLoadingFamilies: false,
        isLoading: false,
      });
      throw error;
    }
  },

  // Load family members
  loadFamilyMembers: async (familyId: string) => {
    try {
      const members = await memberService.getFamilyMembers(familyId);
      set({ members });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'メンバーの読み込みに失敗しました';
      set({ error: message });
      throw error;
    }
  },

  // Simple setters
  setError: (error: string) => {
    set({ error });
  },

  setFamilies: (families: UserFamilyRelation[]) => {
    set({ userFamilies: families, families });
  },

  setMembers: (members: FamilyMember[]) => {
    set({ members });
  },

  clearError: () => {
    set({ error: null });
  },
}));
