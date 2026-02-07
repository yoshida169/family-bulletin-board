import firestore from '@react-native-firebase/firestore';
import { Collections } from './config';
import type { InviteCode } from '@/src/types/family';
import { memberService } from './member';

const INVITE_CODE_LENGTH = 6;
const INVITE_CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const DEFAULT_EXPIRY_DAYS = 7;
const DEFAULT_MAX_USES = 1;

interface CreateInviteCodeInput {
  familyId: string;
  createdBy: string;
  maxUses?: number;
  expiresAt?: Date;
}

export const invitationService = {
  /**
   * Generate a random 6-character invite code
   */
  generateInviteCode: (): string => {
    let code = '';
    for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
      const randomIndex = Math.floor(Math.random() * INVITE_CODE_CHARS.length);
      code += INVITE_CODE_CHARS[randomIndex];
    }
    return code;
  },

  /**
   * Create a new invite code
   */
  createInviteCode: async (
    input: CreateInviteCodeInput
  ): Promise<InviteCode> => {
    const inviteCodeRef = firestore().collection(Collections.INVITE_CODES).doc();
    const now = new Date();

    // Generate unique code
    let code = invitationService.generateInviteCode();
    let isUnique = false;

    // Ensure code is unique
    while (!isUnique) {
      const existing = await invitationService.getInviteCodeByCode(code);
      if (!existing) {
        isUnique = true;
      } else {
        code = invitationService.generateInviteCode();
      }
    }

    // Calculate expiry date
    const expiryDate = input.expiresAt ?? new Date(now.getTime() + DEFAULT_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    const inviteCodeData = {
      id: inviteCodeRef.id,
      familyId: input.familyId,
      code,
      createdAt: firestore.FieldValue.serverTimestamp(),
      createdBy: input.createdBy,
      expiresAt: firestore.Timestamp.fromDate(expiryDate),
      maxUses: input.maxUses ?? DEFAULT_MAX_USES,
      usedCount: 0,
      usedBy: [],
      isActive: true,
    };

    await inviteCodeRef.set(inviteCodeData);

    return {
      ...inviteCodeData,
      createdAt: now,
      expiresAt: expiryDate,
    } as InviteCode;
  },

  /**
   * Get invite code by code string
   */
  getInviteCodeByCode: async (code: string): Promise<InviteCode | null> => {
    const snapshot = await firestore()
      .collection(Collections.INVITE_CODES)
      .where('code', '==', code)
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    const data = doc.data();

    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toDate() ?? new Date(),
      expiresAt: data.expiresAt?.toDate() ?? new Date(),
    } as InviteCode;
  },

  /**
   * Get invite code by ID
   */
  getInviteCode: async (inviteCodeId: string): Promise<InviteCode | null> => {
    const doc = await firestore()
      .collection(Collections.INVITE_CODES)
      .doc(inviteCodeId)
      .get();

    if (!doc.exists) return null;

    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: data?.createdAt?.toDate() ?? new Date(),
      expiresAt: data?.expiresAt?.toDate() ?? new Date(),
    } as InviteCode;
  },

  /**
   * Validate an invite code
   */
  validateInviteCode: async (
    code: string
  ): Promise<{ isValid: boolean; familyId?: string; error?: string }> => {
    const inviteCode = await invitationService.getInviteCodeByCode(code);

    if (!inviteCode) {
      return { isValid: false, error: '無効な招待コードです' };
    }

    if (!inviteCode.isActive) {
      return { isValid: false, error: 'この招待コードは無効化されています' };
    }

    const now = new Date();
    if (inviteCode.expiresAt < now) {
      return { isValid: false, error: '招待コードの有効期限が切れています' };
    }

    if (inviteCode.usedCount >= inviteCode.maxUses) {
      return { isValid: false, error: '招待コードの使用上限に達しています' };
    }

    return { isValid: true, familyId: inviteCode.familyId };
  },

  /**
   * Use invite code to join family
   */
  useInviteCode: async (
    code: string,
    userId: string,
    displayName: string,
    photoURL?: string | null
  ): Promise<{ success: boolean; familyId?: string; error?: string }> => {
    const inviteCode = await invitationService.getInviteCodeByCode(code);

    if (!inviteCode) {
      return { success: false, error: '招待コードが見つかりません' };
    }

    if (!inviteCode.isActive) {
      return { success: false, error: 'この招待コードは無効です' };
    }

    const now = new Date();
    if (inviteCode.expiresAt < now) {
      return { success: false, error: '招待コードの有効期限が切れています' };
    }

    if (inviteCode.usedCount >= inviteCode.maxUses) {
      return { success: false, error: '招待コードの使用回数上限に達しています' };
    }

    try {
      // Add user to family
      await memberService.addMember({
        familyId: inviteCode.familyId,
        userId,
        displayName,
        photoURL: photoURL ?? null,
        relation: 'その他', // Default relation, user can change later
        role: 'child', // Default role
        invitedBy: inviteCode.createdBy,
      });

      // Increment used count and add user to usedBy
      const newUsedCount = inviteCode.usedCount + 1;
      const updateData: Record<string, unknown> = {
        usedCount: firestore.FieldValue.increment(1),
        usedBy: firestore.FieldValue.arrayUnion(userId),
      };

      // Deactivate if max uses reached
      if (newUsedCount >= inviteCode.maxUses) {
        updateData.isActive = false;
      }

      await firestore()
        .collection(Collections.INVITE_CODES)
        .doc(inviteCode.id)
        .update(updateData);

      return { success: true, familyId: inviteCode.familyId };
    } catch (error) {
      console.error('Error using invite code:', error);
      return {
        success: false,
        error: 'ファミリーへの参加に失敗しました。既にメンバーの可能性があります。'
      };
    }
  },

  /**
   * Deactivate an invite code by code string
   */
  deactivateInviteCode: async (code: string): Promise<void> => {
    const snapshot = await firestore()
      .collection(Collections.INVITE_CODES)
      .where('code', '==', code)
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new Error('招待コードが見つかりません');
    }

    await snapshot.docs[0].ref.update({ isActive: false });
  },

  /**
   * Deactivate an invite code by ID
   */
  deactivateInviteCodeById: async (inviteCodeId: string): Promise<void> => {
    await firestore()
      .collection(Collections.INVITE_CODES)
      .doc(inviteCodeId)
      .update({
        isActive: false,
      });
  },

  /**
   * Get all invite codes for a family
   */
  getFamilyInviteCodes: async (familyId: string): Promise<InviteCode[]> => {
    const snapshot = await firestore()
      .collection(Collections.INVITE_CODES)
      .where('familyId', '==', familyId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() ?? new Date(),
        expiresAt: data.expiresAt?.toDate() ?? new Date(),
      } as InviteCode;
    });
  },

  /**
   * Get active invite codes for a family
   */
  getActiveFamilyInviteCodes: async (familyId: string): Promise<InviteCode[]> => {
    const now = firestore.Timestamp.now();
    const snapshot = await firestore()
      .collection(Collections.INVITE_CODES)
      .where('familyId', '==', familyId)
      .where('isActive', '==', true)
      .where('expiresAt', '>', now)
      .orderBy('expiresAt', 'desc')
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() ?? new Date(),
        expiresAt: data.expiresAt?.toDate() ?? new Date(),
      } as InviteCode;
    });
  },

  /**
   * Alias for getActiveFamilyInviteCodes (for test compatibility)
   */
  getActiveInviteCodes: async (familyId: string): Promise<InviteCode[]> => {
    return invitationService.getActiveFamilyInviteCodes(familyId);
  },

  /**
   * Delete expired and used invite codes (for batch cleanup)
   */
  deleteExpiredInviteCodes: async (): Promise<number> => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const snapshot = await firestore()
      .collection(Collections.INVITE_CODES)
      .where('isActive', '==', false)
      .where('expiresAt', '<', firestore.Timestamp.fromDate(sevenDaysAgo))
      .get();

    const batch = firestore().batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    return snapshot.size;
  },
};
