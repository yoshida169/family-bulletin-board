import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import * as ExpoImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

export interface ImagePickerProps {
  /**
   * 選択された画像URIの配列
   */
  images: string[];
  /**
   * 画像が選択されたときのコールバック
   */
  onImagesChange: (images: string[]) => void;
  /**
   * 最大画像数（デフォルト: 3）
   */
  maxImages?: number;
  /**
   * 無効状態
   */
  disabled?: boolean;
}

/**
 * 画像選択コンポーネント
 * 
 * カメラまたはフォトライブラリから画像を選択し、
 * 選択した画像のプレビューを表示する
 */
export function ImagePicker({
  images,
  onImagesChange,
  maxImages = 3,
  disabled = false,
}: ImagePickerProps) {
  /**
   * カメラ/フォトライブラリの権限をリクエスト
   */
  const requestPermissions = async () => {
    const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        '権限が必要です',
        'フォトライブラリへのアクセス権限が必要です。設定から権限を許可してください。'
      );
      return false;
    }
    return true;
  };

  /**
   * フォトライブラリから画像を選択
   */
  const pickImageFromLibrary = async () => {
    if (disabled) return;

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    if (images.length >= maxImages) {
      Alert.alert('画像の上限', `画像は最大${maxImages}枚まで選択できます。`);
      return;
    }

    try {
      const result = await ExpoImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 1,
        allowsMultipleSelection: true,
        selectionLimit: maxImages - images.length,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newImages = result.assets.map(asset => asset.uri);
        onImagesChange([...images, ...newImages].slice(0, maxImages));
      }
    } catch (error) {
      console.error('画像選択エラー:', error);
      Alert.alert('エラー', '画像の選択に失敗しました');
    }
  };

  /**
   * カメラで写真を撮影
   */
  const pickImageFromCamera = async () => {
    if (disabled) return;

    const { status } = await ExpoImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        '権限が必要です',
        'カメラへのアクセス権限が必要です。設定から権限を許可してください。'
      );
      return;
    }

    if (images.length >= maxImages) {
      Alert.alert('画像の上限', `画像は最大${maxImages}枚まで選択できます。`);
      return;
    }

    try {
      const result = await ExpoImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newImage = result.assets[0].uri;
        onImagesChange([...images, newImage]);
      }
    } catch (error) {
      console.error('カメラ起動エラー:', error);
      Alert.alert('エラー', '写真の撮影に失敗しました');
    }
  };

  /**
   * 画像を削除
   */
  const removeImage = (index: number) => {
    if (disabled) return;
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  /**
   * 選択方法を選ぶアクションシートを表示
   */
  const showImagePickerOptions = () => {
    if (disabled) return;

    Alert.alert(
      '画像を選択',
      '画像の選択方法を選んでください',
      [
        {
          text: 'フォトライブラリから選択',
          onPress: pickImageFromLibrary,
        },
        {
          text: 'カメラで撮影',
          onPress: pickImageFromCamera,
        },
        {
          text: 'キャンセル',
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* 選択済み画像のプレビュー */}
      {images.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.previewContainer}
        >
          {images.map((uri, index) => (
            <View key={index} style={styles.imageWrapper}>
              <Image source={{ uri }} style={styles.previewImage} />
              <Pressable
                style={styles.removeButton}
                onPress={() => removeImage(index)}
                disabled={disabled}
                accessible
                accessibilityRole="button"
                accessibilityLabel="画像を削除"
              >
                <Ionicons name="close-circle" size={24} color="#fff" />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}

      {/* 画像追加ボタン */}
      {images.length < maxImages && (
        <Pressable
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.addButtonPressed,
            disabled && styles.addButtonDisabled,
          ]}
          onPress={showImagePickerOptions}
          disabled={disabled}
          accessible
          accessibilityRole="button"
          accessibilityLabel="画像を追加"
        >
          <Ionicons
            name="camera-outline"
            size={32}
            color={disabled ? '#ccc' : '#666'}
          />
          <Text style={[styles.addButtonText, disabled && styles.addButtonTextDisabled]}>
            画像を追加 ({images.length}/{maxImages})
          </Text>
        </Pressable>
      )}

      {/* ヘルプテキスト */}
      {images.length === 0 && (
        <Text style={styles.helpText}>
          画像は最大{maxImages}枚まで添付できます
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  previewContainer: {
    marginBottom: 12,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: '#fafafa',
  },
  addButtonPressed: {
    backgroundColor: '#f0f0f0',
  },
  addButtonDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
  },
  addButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  addButtonTextDisabled: {
    color: '#ccc',
  },
  helpText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
