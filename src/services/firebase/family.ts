import firestore from '@react-native-firebase/firestore';
import { Collections } from './config';
import type {
  Family,
  FamilySettings,
  FamilyMember,
  UserFamilyRelation,
  Relation,
  MemberRole,
} from '@/src/types/family';

const defaultFamilySettings: FamilySettings = {
  allowChildrenToPost: true,
  allowChildrenToComment: true,
  requireApprovalForPosts: false,
};

interface CreateFamilyInput {
  name: string;
  description?: string | null;
  ownerId: string;
  ownerName: string;
  ownerRelation: Relation;
  ownerPhotoURL?: string | null;
}

interface UpdateFamilyInput {
  name?: string;
  description?: string | null;
  iconURL?: string | null;
  settings?: Partial<FamilySettings>;
}

export const familyService = {
  /**
   * Create a new family
   */
  createFamily: async (input: CreateFamilyInput): Promise<Family> => {
    const familyRef = firestore().collection(Collections.FAMILIES).doc();
    const now = firestore.FieldValue.serverTimestamp();

    const familyData = {
      id: familyRef.id,
      name: input.name,
      description: input.description ?? null,
      iconURL: null,
      ownerId: input.ownerId,
      adminIds: [input.ownerId],
      memberCount: 1,
      postCount: 0,
      settings: defaultFamilySettings,
      createdAt: now,
      updatedAt: now,
    };

    await familyRef.set(familyData);

    // Add owner as a member
    const memberRef = firestore()
      .collection(Collections.FAMILIES)
      .doc(familyRef.id)
      .collection(Collections.MEMBERS)
      .doc(input.ownerId);

    const memberData: Omit<FamilyMember, 'joinedAt'> & { joinedAt: ReturnType<typeof firestore.FieldValue.serverTimestamp> } = {
      userId: input.ownerId,
      displayName: input.ownerName,
      photoURL: input.ownerPhotoURL ?? null,
      relation: input.ownerRelation,
      role: 'admin',
      invitedBy: null,
      joinedAt: now,
    };

    await memberRef.set(memberData);

    // Add to user's family list
    const userFamilyRef = firestore()
      .collection(Collections.USER_FAMILIES)
      .doc(`${input.ownerId}_${familyRef.id}`);

    const userFamilyData = {
      familyId: familyRef.id,
      familyName: input.name,
      familyIconURL: null,
      role: 'admin',
      relation: input.ownerRelation,
      joinedAt: now,
      lastViewedAt: now,
      unreadPostCount: 0,
    };

    await userFamilyRef.set(userFamilyData);

    return {
      ...familyData,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Family;
  },

  /**
   * Get a family by ID
   */
  getFamily: async (familyId: string): Promise<Family | null> => {
    const doc = await firestore()
      .collection(Collections.FAMILIES)
      .doc(familyId)
      .get();

    if (!doc.exists) return null;

    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: data?.createdAt?.toDate() ?? new Date(),
      updatedAt: data?.updatedAt?.toDate() ?? new Date(),
    } as Family;
  },

  /**
   * Update a family
   */
  updateFamily: async (
    familyId: string,
    updates: UpdateFamilyInput
  ): Promise<void> => {
    const updateData: Record<string, unknown> = {
      ...updates,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };

    // If settings is provided, merge with existing settings
    if (updates.settings) {
      updateData.settings = updates.settings;
    }

    await firestore()
      .collection(Collections.FAMILIES)
      .doc(familyId)
      .update(updateData);

    // Update family name in user family relations if name changed
    if (updates.name) {
      const membersSnapshot = await firestore()
        .collection(Collections.FAMILIES)
        .doc(familyId)
        .collection(Collections.MEMBERS)
        .get();

      const batch = firestore().batch();
      membersSnapshot.docs.forEach((memberDoc) => {
        const userFamilyRef = firestore()
          .collection(Collections.USER_FAMILIES)
          .doc(`${memberDoc.id}_${familyId}`);
        batch.update(userFamilyRef, { familyName: updates.name });
      });
      await batch.commit();
    }
  },

  /**
   * Delete a family
   */
  deleteFamily: async (familyId: string): Promise<void> => {
    // Get all members first
    const membersSnapshot = await firestore()
      .collection(Collections.FAMILIES)
      .doc(familyId)
      .collection(Collections.MEMBERS)
      .get();

    const batch = firestore().batch();

    // Delete user family relations
    membersSnapshot.docs.forEach((memberDoc) => {
      const userFamilyRef = firestore()
        .collection(Collections.USER_FAMILIES)
        .doc(`${memberDoc.id}_${familyId}`);
      batch.delete(userFamilyRef);
    });

    // Delete members subcollection
    membersSnapshot.docs.forEach((memberDoc) => {
      batch.delete(memberDoc.ref);
    });

    // Delete the family document
    const familyRef = firestore().collection(Collections.FAMILIES).doc(familyId);
    batch.delete(familyRef);

    await batch.commit();
  },

  /**
   * Get all families a user belongs to
   */
  getUserFamilies: async (userId: string): Promise<UserFamilyRelation[]> => {
    const snapshot = await firestore()
      .collection(Collections.USER_FAMILIES)
      .where('familyId', '!=', '')
      .orderBy('familyId')
      .get();

    // Filter by userId from document ID (format: {userId}_{familyId})
    const userFamilies = snapshot.docs
      .filter((doc) => doc.id.startsWith(`${userId}_`))
      .map((doc) => {
        const data = doc.data();
        return {
          ...data,
          joinedAt: data.joinedAt?.toDate() ?? new Date(),
          lastViewedAt: data.lastViewedAt?.toDate() ?? new Date(),
        } as UserFamilyRelation;
      });

    return userFamilies;
  },

  /**
   * Check if user is admin of a family
   */
  isUserAdmin: async (familyId: string, userId: string): Promise<boolean> => {
    const doc = await firestore()
      .collection(Collections.FAMILIES)
      .doc(familyId)
      .get();

    if (!doc.exists) return false;

    const data = doc.data();
    return data?.adminIds?.includes(userId) ?? false;
  },

  /**
   * Check if user is owner of a family
   */
  isUserOwner: async (familyId: string, userId: string): Promise<boolean> => {
    const doc = await firestore()
      .collection(Collections.FAMILIES)
      .doc(familyId)
      .get();

    if (!doc.exists) return false;

    const data = doc.data();
    return data?.ownerId === userId;
  },

  /**
   * Update family settings
   */
  updateFamilySettings: async (
    familyId: string,
    settings: Partial<FamilySettings>
  ): Promise<void> => {
    await firestore()
      .collection(Collections.FAMILIES)
      .doc(familyId)
      .update({
        settings: settings,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
  },

  /**
   * Increment post count
   */
  incrementPostCount: async (familyId: string): Promise<void> => {
    await firestore()
      .collection(Collections.FAMILIES)
      .doc(familyId)
      .update({
        postCount: firestore.FieldValue.increment(1),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
  },

  /**
   * Decrement post count
   */
  decrementPostCount: async (familyId: string): Promise<void> => {
    await firestore()
      .collection(Collections.FAMILIES)
      .doc(familyId)
      .update({
        postCount: firestore.FieldValue.increment(-1),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
  },
};
