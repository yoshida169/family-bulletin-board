import * as Notifications from 'expo-notifications';
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import {
  requestNotificationPermission,
  registerFCMToken,
  unregisterFCMToken,
  getNotificationSettings,
  updateNotificationSettings,
  updateFamilyNotificationSettings,
} from '@/services/firebase/notification';

// Mock dependencies
jest.mock('expo-notifications');
jest.mock('@react-native-firebase/messaging', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    requestPermission: jest.fn(),
    getToken: jest.fn(),
    deleteToken: jest.fn(),
    onMessage: jest.fn(),
    setBackgroundMessageHandler: jest.fn(),
  })),
}));
jest.mock('@react-native-firebase/firestore', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
      })),
    })),
  })),
}));

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestNotificationPermission', () => {
    it('should request and return notification permission status', async () => {
      const mockRequestPermissionsAsync = jest.fn().mockResolvedValue({
        status: 'granted',
        canAskAgain: true,
        granted: true,
      });
      (Notifications.requestPermissionsAsync as jest.Mock) = mockRequestPermissionsAsync;

      const result = await requestNotificationPermission();

      expect(mockRequestPermissionsAsync).toHaveBeenCalled();
      expect(result).toEqual({
        granted: true,
        status: 'granted',
      });
    });

    it('should return denied status when permission is denied', async () => {
      const mockRequestPermissionsAsync = jest.fn().mockResolvedValue({
        status: 'denied',
        canAskAgain: false,
        granted: false,
      });
      (Notifications.requestPermissionsAsync as jest.Mock) = mockRequestPermissionsAsync;

      const result = await requestNotificationPermission();

      expect(result).toEqual({
        granted: false,
        status: 'denied',
      });
    });

    it('should handle errors and return denied status', async () => {
      const mockRequestPermissionsAsync = jest.fn().mockRejectedValue(new Error('Permission error'));
      (Notifications.requestPermissionsAsync as jest.Mock) = mockRequestPermissionsAsync;

      const result = await requestNotificationPermission();

      expect(result).toEqual({
        granted: false,
        status: 'denied',
      });
    });
  });

  describe('registerFCMToken', () => {
    const mockUserId = 'user123';
    const mockToken = 'fcm-token-123';

    it('should register FCM token for iOS', async () => {
      Platform.OS = 'ios';
      const mockGetToken = jest.fn().mockResolvedValue(mockToken);
      const mockMessaging = {
        requestPermission: jest.fn().mockResolvedValue(1), // AuthorizationStatus.AUTHORIZED
        getToken: mockGetToken,
      };
      (messaging as any).mockReturnValue(mockMessaging);

      const mockUpdate = jest.fn().mockResolvedValue(undefined);
      const mockFirestore = {
        collection: jest.fn(() => ({
          doc: jest.fn(() => ({
            update: mockUpdate,
          })),
        })),
      };

      const result = await registerFCMToken(mockUserId, mockFirestore as any);

      expect(mockGetToken).toHaveBeenCalled();
      expect(result).toBe(mockToken);
    });

    it('should register FCM token for Android', async () => {
      Platform.OS = 'android';
      const mockGetToken = jest.fn().mockResolvedValue(mockToken);
      const mockMessaging = {
        getToken: mockGetToken,
      };
      (messaging as any).mockReturnValue(mockMessaging);

      const mockUpdate = jest.fn().mockResolvedValue(undefined);
      const mockFirestore = {
        collection: jest.fn(() => ({
          doc: jest.fn(() => ({
            update: mockUpdate,
          })),
        })),
      };

      const result = await registerFCMToken(mockUserId, mockFirestore as any);

      expect(mockGetToken).toHaveBeenCalled();
      expect(result).toBe(mockToken);
    });

    it('should handle token registration errors', async () => {
      const mockMessaging = {
        requestPermission: jest.fn().mockResolvedValue(1),
        getToken: jest.fn().mockRejectedValue(new Error('Token error')),
      };
      (messaging as any).mockReturnValue(mockMessaging);

      const mockFirestore = {
        collection: jest.fn(() => ({
          doc: jest.fn(() => ({
            update: jest.fn(),
          })),
        })),
      };

      await expect(registerFCMToken(mockUserId, mockFirestore as any)).rejects.toThrow('Token error');
    });
  });

  describe('unregisterFCMToken', () => {
    const mockUserId = 'user123';
    const mockToken = 'fcm-token-123';

    it('should unregister FCM token', async () => {
      const mockDeleteToken = jest.fn().mockResolvedValue(undefined);
      const mockMessaging = {
        deleteToken: mockDeleteToken,
      };
      (messaging as any).mockReturnValue(mockMessaging);

      const mockUpdate = jest.fn().mockResolvedValue(undefined);
      const mockFirestore = {
        collection: jest.fn(() => ({
          doc: jest.fn(() => ({
            update: mockUpdate,
          })),
        })),
      };

      await unregisterFCMToken(mockUserId, mockToken, mockFirestore as any);

      expect(mockDeleteToken).toHaveBeenCalled();
    });
  });

  describe('getNotificationSettings', () => {
    const mockUserId = 'user123';

    it('should get notification settings', async () => {
      const mockSettings = {
        pushNotificationsEnabled: true,
        notifyOnNewPost: true,
        notifyOnComment: true,
        notifyOnMention: false,
        familySettings: {
          family1: { enabled: true },
          family2: { enabled: false },
        },
      };

      const mockGet = jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({ settings: mockSettings }),
      });
      const mockFirestore = {
        collection: jest.fn(() => ({
          doc: jest.fn(() => ({
            get: mockGet,
          })),
        })),
      };

      const result = await getNotificationSettings(mockUserId, mockFirestore as any);

      expect(result).toEqual(mockSettings);
    });

    it('should return default settings when user not found', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        exists: false,
      });
      const mockFirestore = {
        collection: jest.fn(() => ({
          doc: jest.fn(() => ({
            get: mockGet,
          })),
        })),
      };

      const result = await getNotificationSettings(mockUserId, mockFirestore as any);

      expect(result).toEqual({
        pushNotificationsEnabled: true,
        notifyOnNewPost: true,
        notifyOnComment: true,
        notifyOnMention: true,
        familySettings: {},
      });
    });
  });

  describe('updateNotificationSettings', () => {
    const mockUserId = 'user123';

    it('should update notification settings', async () => {
      const mockSettings = {
        pushNotificationsEnabled: false,
        notifyOnNewPost: false,
        notifyOnComment: true,
        notifyOnMention: true,
      };

      const mockUpdate = jest.fn().mockResolvedValue(undefined);
      const mockFirestore = {
        collection: jest.fn(() => ({
          doc: jest.fn(() => ({
            update: mockUpdate,
          })),
        })),
      };

      await updateNotificationSettings(mockUserId, mockSettings, mockFirestore as any);

      expect(mockUpdate).toHaveBeenCalledWith({
        'settings.pushNotificationsEnabled': false,
        'settings.notifyOnNewPost': false,
        'settings.notifyOnComment': true,
        'settings.notifyOnMention': true,
      });
    });
  });

  describe('updateFamilyNotificationSettings', () => {
    const mockUserId = 'user123';
    const mockFamilyId = 'family123';

    it('should update family notification settings', async () => {
      const mockUpdate = jest.fn().mockResolvedValue(undefined);
      const mockFirestore = {
        collection: jest.fn(() => ({
          doc: jest.fn(() => ({
            update: mockUpdate,
          })),
        })),
      };

      await updateFamilyNotificationSettings(mockUserId, mockFamilyId, true, mockFirestore as any);

      expect(mockUpdate).toHaveBeenCalledWith({
        [`settings.familySettings.${mockFamilyId}.enabled`]: true,
      });
    });

    it('should disable family notifications', async () => {
      const mockUpdate = jest.fn().mockResolvedValue(undefined);
      const mockFirestore = {
        collection: jest.fn(() => ({
          doc: jest.fn(() => ({
            update: mockUpdate,
          })),
        })),
      };

      await updateFamilyNotificationSettings(mockUserId, mockFamilyId, false, mockFirestore as any);

      expect(mockUpdate).toHaveBeenCalledWith({
        [`settings.familySettings.${mockFamilyId}.enabled`]: false,
      });
    });
  });
});
