import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RelationPicker } from '@components/family/RelationPicker';
import { RELATIONS } from '@constants/relations';

describe('RelationPicker', () => {
  it('should render all available relations', () => {
    const { getByText } = render(
      <RelationPicker value={null} onSelect={jest.fn()} />
    );

    RELATIONS.forEach((relation) => {
      expect(getByText(relation.label)).toBeTruthy();
    });
  });

  it('should highlight selected relation', () => {
    const { getByTestId } = render(
      <RelationPicker value="お父さん" onSelect={jest.fn()} />
    );

    expect(getByTestId('relation-お父さん-selected')).toBeTruthy();
  });

  it('should call onSelect when a relation is selected', () => {
    const onSelect = jest.fn();
    const { getByText } = render(
      <RelationPicker value={null} onSelect={onSelect} />
    );

    fireEvent.press(getByText('お母さん'));
    expect(onSelect).toHaveBeenCalledWith('お母さん');
  });

  it('should allow custom relations if enabled', () => {
    const onSelect = jest.fn();
    const { getByPlaceholderText, getByText } = render(
      <RelationPicker
        value={null}
        onSelect={onSelect}
        allowCustom={true}
      />
    );

    const customInput = getByPlaceholderText('カスタム続柄を入力');
    fireEvent.changeText(customInput, 'いとこ');
    fireEvent.press(getByText('追加'));

    expect(onSelect).toHaveBeenCalledWith('いとこ');
  });

  it('should show error for empty custom relation', () => {
    const { getByPlaceholderText, getByText } = render(
      <RelationPicker
        value={null}
        onSelect={jest.fn()}
        allowCustom={true}
      />
    );

    const customInput = getByPlaceholderText('カスタム続柄を入力');
    fireEvent.changeText(customInput, '');
    fireEvent.press(getByText('追加'));

    expect(getByText('続柄を入力してください')).toBeTruthy();
  });
});
