import React, { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import messaging from '@react-native-firebase/messaging';
import { useRouter } from 'expo-router';

/**
 * 通知の表示設定
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * 通知データ型
 */
interface NotificationData {
  familyId?: string;
  boardId?: string;
  postId?: string;
  commentId?: string;
  type?: 'new_post' | 'new_comment' | 'member_join';
}

/**
 * 通知ハンドラーコンポーネント
 * フォアグラウンド・バックグラウンド通知を処理
 */
export function NotificationHandler() {
  const router = useRouter();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // フォアグラウンド通知リスナー
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('通知受信:', notification);
        // 必要に応じてカスタム処理を追加
      }
    );

    // 通知タップ時のリスナー
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as NotificationData;
        handleNotificationNavigation(data);
      }
    );

    // FCMフォアグラウンドメッセージハンドラー
    const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
      console.log('FCMフォアグラウンドメッセージ:', remoteMessage);

      // Expo Notificationsを使ってローカル通知を表示
      if (remoteMessage.notification) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: remoteMessage.notification.title || '',
            body: remoteMessage.notification.body || '',
            data: remoteMessage.data,
          },
          trigger: null, // すぐに表示
        });
      }
    });

    // バックグラウンドメッセージハンドラー（アプリ起動前に設定）
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('FCMバックグラウンドメッセージ:', remoteMessage);
      // バックグラウンドでの処理（必要に応じて）
    });

    // アプリが終了状態から通知で起動された場合
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('アプリ起動通知:', remoteMessage);
          handleNotificationNavigation(remoteMessage.data as NotificationData);
        }
      });

    // クリーンアップ
    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
      unsubscribeForeground();
    };
  }, [router]);

  /**
   * 通知データに基づいて画面遷移
   */
  const handleNotificationNavigation = (data: NotificationData) => {
    if (!data) return;

    try {
      if (data.type === 'new_post' || data.type === 'new_comment') {
        // 投稿詳細画面へ遷移
        if (data.familyId && data.boardId && data.postId) {
          router.push(
            `/(main)/family/${data.familyId}/board/${data.boardId}/post/${data.postId}`
          );
        }
        // 掲示板画面へ遷移
        else if (data.familyId && data.boardId) {
          router.push(`/(main)/family/${data.familyId}/board/${data.boardId}`);
        }
        // ファミリーホーム画面へ遷移
        else if (data.familyId) {
          router.push(`/(main)/family/${data.familyId}`);
        }
      } else if (data.type === 'member_join') {
        // メンバー一覧画面へ遷移
        if (data.familyId) {
          router.push(`/(main)/family/${data.familyId}/members`);
        }
      }
    } catch (error) {
      console.error('通知ナビゲーションエラー:', error);
    }
  };

  // このコンポーネントはUIを持たない
  return null;
}
