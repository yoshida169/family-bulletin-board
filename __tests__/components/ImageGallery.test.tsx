import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ImageGallery } from '@/components/board/ImageGallery';

describe('ImageGallery', () => {
  const mockImages = [
    'https://example.com/image1.jpg',
    'https://example.com/image2.jpg',
    'https://example.com/image3.jpg',
  ];

  it('画像が空の場合、何も表示しない', () => {
    const { toJSON } = render(<ImageGallery images={[]} />);
    expect(toJSON()).toBeNull();
  });

  it('画像が1枚の場合、大きく表示する', () => {
    const { getByLabelText } = render(<ImageGallery images={[mockImages[0]]} />);
    expect(getByLabelText('画像 1')).toBeTruthy();
  });

  it('複数画像の場合、グリッド表示する', () => {
    const { getByLabelText } = render(<ImageGallery images={mockImages} />);

    expect(getByLabelText('画像 1')).toBeTruthy();
    expect(getByLabelText('画像 2')).toBeTruthy();
    expect(getByLabelText('画像 3')).toBeTruthy();
  });

  it('サムネイルをタップするとフルスクリーンモーダルが開く', () => {
    const { getByLabelText, getByText } = render(<ImageGallery images={mockImages} />);

    fireEvent.press(getByLabelText('画像 1'));

    // モーダルが表示される
    expect(getByText('1 / 3')).toBeTruthy();
    expect(getByLabelText('閉じる')).toBeTruthy();
  });

  it('閉じるボタンをタップするとモーダルが閉じる', () => {
    const { getByLabelText, queryByLabelText } = render(
      <ImageGallery images={mockImages} />
    );

    // モーダルを開く
    fireEvent.press(getByLabelText('画像 1'));
    expect(getByLabelText('閉じる')).toBeTruthy();

    // 閉じる
    fireEvent.press(getByLabelText('閉じる'));
    expect(queryByLabelText('閉じる')).toBeNull();
  });

  it('次へボタンで次の画像に移動する', () => {
    const { getByLabelText, getByText } = render(<ImageGallery images={mockImages} />);

    // モーダルを開く
    fireEvent.press(getByLabelText('画像 1'));
    expect(getByText('1 / 3')).toBeTruthy();

    // 次へ
    fireEvent.press(getByLabelText('次の画像'));
    expect(getByText('2 / 3')).toBeTruthy();
  });

  it('前へボタンで前の画像に移動する', () => {
    const { getByLabelText, getByText } = render(<ImageGallery images={mockImages} />);

    // 2枚目の画像を開く
    fireEvent.press(getByLabelText('画像 2'));
    expect(getByText('2 / 3')).toBeTruthy();

    // 前へ
    fireEvent.press(getByLabelText('前の画像'));
    expect(getByText('1 / 3')).toBeTruthy();
  });

  it('最初の画像では前へボタンが表示されない', () => {
    const { getByLabelText, queryByLabelText } = render(
      <ImageGallery images={mockImages} />
    );

    fireEvent.press(getByLabelText('画像 1'));
    expect(queryByLabelText('前の画像')).toBeNull();
  });

  it('最後の画像では次へボタンが表示されない', () => {
    const { getByLabelText, queryByLabelText } = render(
      <ImageGallery images={mockImages} />
    );

    fireEvent.press(getByLabelText('画像 3'));
    expect(queryByLabelText('次の画像')).toBeNull();
  });

  it('画像が1枚の場合、ナビゲーションボタンは表示されない', () => {
    const { getByLabelText, queryByLabelText } = render(
      <ImageGallery images={[mockImages[0]]} />
    );

    fireEvent.press(getByLabelText('画像 1'));
    expect(queryByLabelText('前の画像')).toBeNull();
    expect(queryByLabelText('次の画像')).toBeNull();
  });

  it('カスタムサムネイルサイズを適用できる', () => {
    const { getByLabelText } = render(
      <ImageGallery images={mockImages} thumbnailSize={150} />
    );

    const thumbnail = getByLabelText('画像 1');
    expect(thumbnail.props.style).toMatchObject({
      width: 150,
      height: 150,
    });
  });
});
