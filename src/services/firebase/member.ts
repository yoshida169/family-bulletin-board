import firestore from '@react-native-firebase/firestore';
import { Collections } from './config';
import type { FamilyMember, Relation, MemberRole } from '@/src/types/family';

interface AddMemberInput {
  familyId: string;
  userId: string;
  displayName: string;
  photoURL: string | null;
  relation: Relation;
  role: MemberRole;
  invitedBy: string | null;
  familyName?: string;
  familyIconURL?: string | null;
}

export const memberService = {
  /**
   * Add a new member to a family
   */
  addMember: async (input: AddMemberInput): Promise<FamilyMember> => {
    const memberRef = firestore()
      .collection(Collections.FAMILIES)
      .doc(input.familyId)
      .collection(Collections.MEMBERS)
      .doc(input.userId);

    // Check if member already exists
    const existingMember = await memberRef.get();
    if (existingMember.exists()) {
      throw new Error('このユーザーは既にファミリーのメンバーです');
    }

    const now = firestore.FieldValue.serverTimestamp();

    const memberData = {
      userId: input.userId,
      displayName: input.displayName,
      photoURL: input.photoURL,
      relation: input.relation,
      role: input.role,
      invitedBy: input.invitedBy,
      joinedAt: now,
    };

    const batch = firestore().batch();

    // Add member to family's members subcollection
    batch.set(memberRef, memberData);

    // Increment member count
    const familyRef = firestore()
      .collection(Collections.FAMILIES)
      .doc(input.familyId);
    batch.update(familyRef, {
      memberCount: firestore.FieldValue.increment(1),
      updatedAt: now,
    });

    // If user is admin, add to adminIds
    if (input.role === 'admin') {
      batch.update(familyRef, {
        adminIds: firestore.FieldValue.arrayUnion(input.userId),
      });
    }

    // Add to user's family list
    if (input.familyName) {
      const userFamilyRef = firestore()
        .collection(Collections.USER_FAMILIES)
        .doc(`${input.userId}_${input.familyId}`);

      batch.set(userFamilyRef, {
        familyId: input.familyId,
        familyName: input.familyName,
        familyIconURL: input.familyIconURL ?? null,
        role: input.role,
        relation: input.relation,
        joinedAt: now,
        lastViewedAt: now,
        unreadPostCount: 0,
      });
    }

    await batch.commit();

    return {
      ...memberData,
      joinedAt: new Date(),
    } as FamilyMember;
  },

  /**
   * Remove a member from a family
   */
  removeMember: async (familyId: string, userId: string): Promise<void> => {
    const batch = firestore().batch();

    // Delete member from family's members subcollection
    const memberRef = firestore()
      .collection(Collections.FAMILIES)
      .doc(familyId)
      .collection(Collections.MEMBERS)
      .doc(userId);
    batch.delete(memberRef);

    // Decrement member count and remove from adminIds if present
    const familyRef = firestore().collection(Collections.FAMILIES).doc(familyId);
    batch.update(familyRef, {
      memberCount: firestore.FieldValue.increment(-1),
      adminIds: firestore.FieldValue.arrayRemove(userId),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    // Remove from user's family list
    const userFamilyRef = firestore()
      .collection(Collections.USER_FAMILIES)
      .doc(`${userId}_${familyId}`);
    batch.delete(userFamilyRef);

    await batch.commit();
  },

  /**
   * Update a member's role
   */
  updateMemberRole: async (
    familyId: string,
    userId: string,
    role: MemberRole
  ): Promise<void> => {
    const batch = firestore().batch();

    // Update member role
    const memberRef = firestore()
      .collection(Collections.FAMILIES)
      .doc(familyId)
      .collection(Collections.MEMBERS)
      .doc(userId);
    batch.update(memberRef, { role });

    // Update adminIds based on role
    const familyRef = firestore().collection(Collections.FAMILIES).doc(familyId);
    if (role === 'admin') {
      batch.update(familyRef, {
        adminIds: firestore.FieldValue.arrayUnion(userId),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    } else {
      batch.update(familyRef, {
        adminIds: firestore.FieldValue.arrayRemove(userId),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    }

    // Update user's family relation
    const userFamilyRef = firestore()
      .collection(Collections.USER_FAMILIES)
      .doc(`${userId}_${familyId}`);
    batch.update(userFamilyRef, { role });

    await batch.commit();
  },

  /**
   * Update a member's relation
   */
  updateMemberRelation: async (
    familyId: string,
    userId: string,
    relation: Relation
  ): Promise<void> => {
    const batch = firestore().batch();

    // Update member relation
    const memberRef = firestore()
      .collection(Collections.FAMILIES)
      .doc(familyId)
      .collection(Collections.MEMBERS)
      .doc(userId);
    batch.update(memberRef, { relation });

    // Update user's family relation
    const userFamilyRef = firestore()
      .collection(Collections.USER_FAMILIES)
      .doc(`${userId}_${familyId}`);
    batch.update(userFamilyRef, { relation });

    await batch.commit();
  },

  /**
   * Update a member's display name
   */
  updateMemberDisplayName: async (
    familyId: string,
    userId: string,
    displayName: string
  ): Promise<void> => {
    await firestore()
      .collection(Collections.FAMILIES)
      .doc(familyId)
      .collection(Collections.MEMBERS)
      .doc(userId)
      .update({ displayName });
  },

  /**
   * Update a member's photo URL
   */
  updateMemberPhotoURL: async (
    familyId: string,
    userId: string,
    photoURL: string | null
  ): Promise<void> => {
    await firestore()
      .collection(Collections.FAMILIES)
      .doc(familyId)
      .collection(Collections.MEMBERS)
      .doc(userId)
      .update({ photoURL });
  },

  /**
   * Get all members of a family
   */
  getFamilyMembers: async (familyId: string): Promise<FamilyMember[]> => {
    const snapshot = await firestore()
      .collection(Collections.FAMILIES)
      .doc(familyId)
      .collection(Collections.MEMBERS)
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        userId: doc.id,
        joinedAt: data.joinedAt?.toDate() ?? new Date(),
      } as FamilyMember;
    });
  },

  /**
   * Get a specific member
   */
  getMember: async (
    familyId: string,
    userId: string
  ): Promise<FamilyMember | null> => {
    const doc = await firestore()
      .collection(Collections.FAMILIES)
      .doc(familyId)
      .collection(Collections.MEMBERS)
      .doc(userId)
      .get();

    if (!doc.exists()) return null;

    const data = doc.data();
    return {
      ...data,
      userId: doc.id,
      joinedAt: data?.joinedAt?.toDate() ?? new Date(),
    } as FamilyMember;
  },

  /**
   * Check if user is a member of a family
   */
  isMember: async (familyId: string, userId: string): Promise<boolean> => {
    const doc = await firestore()
      .collection(Collections.FAMILIES)
      .doc(familyId)
      .collection(Collections.MEMBERS)
      .doc(userId)
      .get();

    return doc.exists();
  },

  /**
   * Update last viewed timestamp for user's family relation
   */
  updateLastViewed: async (
    familyId: string,
    userId: string
  ): Promise<void> => {
    await firestore()
      .collection(Collections.USER_FAMILIES)
      .doc(`${userId}_${familyId}`)
      .update({
        lastViewedAt: firestore.FieldValue.serverTimestamp(),
        unreadPostCount: 0,
      });
  },
};
