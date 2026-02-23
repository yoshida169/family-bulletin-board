import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Firebase Admin初期化
admin.initializeApp();

/**
 * 新規投稿作成時の通知
 */
export const onPostCreate = functions.firestore
  .document('families/{familyId}/boards/{boardId}/posts/{postId}')
  .onCreate(async (snapshot, context) => {
    const { familyId, boardId, postId } = context.params;
    const postData = snapshot.data();

    try {
      // ファミリーメンバーを取得
      const membersSnapshot = await admin
        .firestore()
        .collection('families')
        .doc(familyId)
        .collection('members')
        .get();

      // 投稿者以外のメンバーに通知
      const notifications: Promise<any>[] = [];

      for (const memberDoc of membersSnapshot.docs) {
        const memberId = memberDoc.id;

        // 投稿者自身には通知しない
        if (memberId === postData.authorId) {
          continue;
        }

        // ユーザーの通知設定を確認
        const userDoc = await admin.firestore().collection('users').doc(memberId).get();

        if (!userDoc.exists) continue;

        const userData = userDoc.data();
        const settings = userData?.settings;

        // 通知設定チェック
        if (
          !settings?.pushNotificationsEnabled ||
          !settings?.notifyOnNewPost ||
          settings?.familySettings?.[familyId]?.enabled === false
        ) {
          continue;
        }

        // FCMトークンを取得
        const fcmTokens = userData?.fcmTokens || [];

        for (const tokenData of fcmTokens) {
          const message = {
            notification: {
              title: `${postData.authorName}さんが投稿しました`,
              body: postData.content.substring(0, 100),
            },
            data: {
              type: 'new_post',
              familyId,
              boardId,
              postId,
            },
            token: tokenData.token,
          };

          notifications.push(
            admin
              .messaging()
              .send(message)
              .catch((error) => {
                console.error(`通知送信エラー (${tokenData.token}):`, error);
                // トークンが無効な場合は削除
                if (
                  error.code === 'messaging/registration-token-not-registered' ||
                  error.code === 'messaging/invalid-registration-token'
                ) {
                  return admin
                    .firestore()
                    .collection('users')
                    .doc(memberId)
                    .update({
                      fcmTokens: admin.firestore.FieldValue.arrayRemove(tokenData),
                    });
                }
              })
          );
        }
      }

      await Promise.all(notifications);
      console.log(`新規投稿通知送信完了: ${postId}`);
    } catch (error) {
      console.error('新規投稿通知エラー:', error);
      throw error;
    }
  });

/**
 * 新規コメント作成時の通知
 */
export const onCommentCreate = functions.firestore
  .document('families/{familyId}/boards/{boardId}/posts/{postId}/comments/{commentId}')
  .onCreate(async (snapshot, context) => {
    const { familyId, boardId, postId, commentId } = context.params;
    const commentData = snapshot.data();

    try {
      // 投稿を取得
      const postDoc = await admin
        .firestore()
        .collection('families')
        .doc(familyId)
        .collection('boards')
        .doc(boardId)
        .collection('posts')
        .doc(postId)
        .get();

      if (!postDoc.exists) {
        console.log('投稿が見つかりません');
        return;
      }

      const postData = postDoc.data();
      if (!postData) return;

      const postAuthorId = postData.authorId;

      // コメント投稿者が投稿者本人の場合は通知しない
      if (commentData.authorId === postAuthorId) {
        return;
      }

      // 投稿者の通知設定を確認
      const userDoc = await admin.firestore().collection('users').doc(postAuthorId).get();

      if (!userDoc.exists) return;

      const userData = userDoc.data();
      const settings = userData?.settings;

      // 通知設定チェック
      if (
        !settings?.pushNotificationsEnabled ||
        !settings?.notifyOnComment ||
        settings?.familySettings?.[familyId]?.enabled === false
      ) {
        return;
      }

      // FCMトークンを取得して通知送信
      const fcmTokens = userData?.fcmTokens || [];
      const notifications: Promise<any>[] = [];

      for (const tokenData of fcmTokens) {
        const message = {
          notification: {
            title: `${commentData.authorName}さんがコメントしました`,
            body: commentData.content.substring(0, 100),
          },
          data: {
            type: 'new_comment',
            familyId,
            boardId,
            postId,
            commentId,
          },
          token: tokenData.token,
        };

        notifications.push(
          admin
            .messaging()
            .send(message)
            .catch((error) => {
              console.error(`通知送信エラー (${tokenData.token}):`, error);
              // トークンが無効な場合は削除
              if (
                error.code === 'messaging/registration-token-not-registered' ||
                error.code === 'messaging/invalid-registration-token'
              ) {
                return admin
                  .firestore()
                  .collection('users')
                  .doc(postAuthorId)
                  .update({
                    fcmTokens: admin.firestore.FieldValue.arrayRemove(tokenData),
                  });
              }
            })
        );
      }

      await Promise.all(notifications);
      console.log(`新規コメント通知送信完了: ${commentId}`);
    } catch (error) {
      console.error('新規コメント通知エラー:', error);
      throw error;
    }
  });

/**
 * ファミリーメンバー参加時の通知
 */
export const onMemberJoin = functions.firestore
  .document('families/{familyId}/members/{memberId}')
  .onCreate(async (snapshot, context) => {
    const { familyId, memberId } = context.params;
    const memberData = snapshot.data();

    try {
      // ファミリー情報を取得
      const familyDoc = await admin.firestore().collection('families').doc(familyId).get();

      if (!familyDoc.exists) {
        console.log('ファミリーが見つかりません');
        return;
      }

      const familyData = familyDoc.data();
      if (!familyData) return;

      // 既存のファミリーメンバーを取得
      const membersSnapshot = await admin
        .firestore()
        .collection('families')
        .doc(familyId)
        .collection('members')
        .get();

      // 新規参加者以外のメンバーに通知
      const notifications: Promise<any>[] = [];

      for (const memberDoc of membersSnapshot.docs) {
        const existingMemberId = memberDoc.id;

        // 新規参加者自身には通知しない
        if (existingMemberId === memberId) {
          continue;
        }

        // ユーザーの通知設定を確認
        const userDoc = await admin
          .firestore()
          .collection('users')
          .doc(existingMemberId)
          .get();

        if (!userDoc.exists) continue;

        const userData = userDoc.data();
        const settings = userData?.settings;

        // 通知設定チェック
        if (
          !settings?.pushNotificationsEnabled ||
          settings?.familySettings?.[familyId]?.enabled === false
        ) {
          continue;
        }

        // FCMトークンを取得
        const fcmTokens = userData?.fcmTokens || [];

        for (const tokenData of fcmTokens) {
          const message = {
            notification: {
              title: `${familyData.name}`,
              body: `${memberData.displayName}さんが参加しました`,
            },
            data: {
              type: 'member_join',
              familyId,
              memberId,
            },
            token: tokenData.token,
          };

          notifications.push(
            admin
              .messaging()
              .send(message)
              .catch((error) => {
                console.error(`通知送信エラー (${tokenData.token}):`, error);
                // トークンが無効な場合は削除
                if (
                  error.code === 'messaging/registration-token-not-registered' ||
                  error.code === 'messaging/invalid-registration-token'
                ) {
                  return admin
                    .firestore()
                    .collection('users')
                    .doc(existingMemberId)
                    .update({
                      fcmTokens: admin.firestore.FieldValue.arrayRemove(tokenData),
                    });
                }
              })
          );
        }
      }

      await Promise.all(notifications);
      console.log(`メンバー参加通知送信完了: ${memberId}`);
    } catch (error) {
      console.error('メンバー参加通知エラー:', error);
      throw error;
    }
  });
