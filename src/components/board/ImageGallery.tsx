import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Modal,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface ImageGalleryProps {
  /**
   * 画像URLの配列
   */
  images: string[];
  /**
   * サムネイルのサイズ（デフォルト: 120）
   */
  thumbnailSize?: number;
  /**
   * 1行に表示する画像数（デフォルト: 3）
   */
  columns?: number;
}

/**
 * 画像ギャラリーコンポーネント
 * 
 * サムネイル表示とフルスクリーンプレビューをサポート
 */
export function ImageGallery({
  images,
  thumbnailSize = 120,
  columns = 3,
}: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [imageLoadErrors, setImageLoadErrors] = useState<{ [key: number]: boolean }>({});

  if (images.length === 0) {
    return null;
  }

  /**
   * フルスクリーンプレビューを開く
   */
  const openFullscreen = (index: number) => {
    setSelectedIndex(index);
  };

  /**
   * フルスクリーンプレビューを閉じる
   */
  const closeFullscreen = () => {
    setSelectedIndex(null);
  };

  /**
   * 次の画像へ
   */
  const goToNext = () => {
    if (selectedIndex !== null && selectedIndex < images.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  /**
   * 前の画像へ
   */
  const goToPrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  /**
   * 画像の読み込みエラーハンドラ
   */
  const handleImageError = (index: number) => {
    setImageLoadErrors(prev => ({ ...prev, [index]: true }));
  };

  /**
   * サムネイルのレイアウト
   */
  const renderThumbnails = () => {
    // 画像が1枚の場合は大きく表示
    if (images.length === 1) {
      return (
        <Pressable onPress={() => openFullscreen(0)} style={styles.singleImageContainer}>
          {imageLoadErrors[0] ? (
            <View style={[styles.singleImage, styles.errorContainer]}>
              <Ionicons name="image-outline" size={48} color="#ccc" />
              <Text style={styles.errorText}>画像を読み込めません</Text>
            </View>
          ) : (
            <Image
              source={{ uri: images[0] }}
              style={styles.singleImage}
              resizeMode="cover"
              onError={() => handleImageError(0)}
            />
          )}
        </Pressable>
      );
    }

    // 複数画像の場合はグリッド表示
    return (
      <View style={styles.gridContainer}>
        {images.map((uri, index) => (
          <Pressable
            key={index}
            onPress={() => openFullscreen(index)}
            style={[
              styles.thumbnailContainer,
              {
                width: thumbnailSize,
                height: thumbnailSize,
                marginRight: (index + 1) % columns === 0 ? 0 : 8,
                marginBottom: 8,
              },
            ]}
            accessible
            accessibilityRole="button"
            accessibilityLabel={`画像 ${index + 1}`}
          >
            {imageLoadErrors[index] ? (
              <View style={[styles.thumbnail, styles.errorContainer]}>
                <Ionicons name="image-outline" size={32} color="#ccc" />
              </View>
            ) : (
              <Image
                source={{ uri }}
                style={styles.thumbnail}
                resizeMode="cover"
                onError={() => handleImageError(index)}
              />
            )}
            {/* 画像インデックス表示 */}
            <View style={styles.indexBadge}>
              <Text style={styles.indexText}>{index + 1}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    );
  };

  return (
    <>
      {/* サムネイル表示 */}
      {renderThumbnails()}

      {/* フルスクリーンプレビューモーダル */}
      <Modal
        visible={selectedIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={closeFullscreen}
      >
        <View style={styles.modalContainer}>
          {/* 背景 */}
          <Pressable style={styles.modalBackdrop} onPress={closeFullscreen} />

          {/* 閉じるボタン */}
          <Pressable
            style={styles.closeButton}
            onPress={closeFullscreen}
            accessible
            accessibilityRole="button"
            accessibilityLabel="閉じる"
          >
            <Ionicons name="close" size={32} color="#fff" />
          </Pressable>

          {/* 画像 */}
          {selectedIndex !== null && (
            <>
              <ScrollView
                contentContainerStyle={styles.imageScrollContainer}
                maximumZoomScale={3}
                minimumZoomScale={1}
              >
                <Image
                  source={{ uri: images[selectedIndex] }}
                  style={styles.fullscreenImage}
                  resizeMode="contain"
                />
              </ScrollView>

              {/* 画像インデックス表示 */}
              <View style={styles.imageCounter}>
                <Text style={styles.imageCounterText}>
                  {selectedIndex + 1} / {images.length}
                </Text>
              </View>

              {/* ナビゲーションボタン */}
              {images.length > 1 && (
                <>
                  {/* 前へボタン */}
                  {selectedIndex > 0 && (
                    <Pressable
                      style={[styles.navButton, styles.navButtonLeft]}
                      onPress={goToPrevious}
                      accessible
                      accessibilityRole="button"
                      accessibilityLabel="前の画像"
                    >
                      <Ionicons name="chevron-back" size={32} color="#fff" />
                    </Pressable>
                  )}

                  {/* 次へボタン */}
                  {selectedIndex < images.length - 1 && (
                    <Pressable
                      style={[styles.navButton, styles.navButtonRight]}
                      onPress={goToNext}
                      accessible
                      accessibilityRole="button"
                      accessibilityLabel="次の画像"
                    >
                      <Ionicons name="chevron-forward" size={32} color="#fff" />
                    </Pressable>
                  )}
                </>
              )}
            </>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  singleImageContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 8,
    overflow: 'hidden',
  },
  singleImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  thumbnailContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  indexBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  indexText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    marginTop: 8,
    fontSize: 12,
    color: '#999',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  closeButton: {
    position: 'absolute',
    top: 48,
    right: 16,
    zIndex: 10,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 22,
  },
  imageScrollContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  imageCounter: {
    position: 'absolute',
    bottom: 48,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  navButton: {
    position: 'absolute',
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 22,
  },
  navButtonLeft: {
    left: 16,
  },
  navButtonRight: {
    right: 16,
  },
});
