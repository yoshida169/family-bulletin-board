import { Relation } from '@types/family';

export const RELATIONS: { value: Relation; label: string; emoji: string }[] = [
  { value: 'お父さん', label: 'お父さん', emoji: '👨' },
  { value: 'お母さん', label: 'お母さん', emoji: '👩' },
  { value: 'お兄ちゃん', label: 'お兄ちゃん', emoji: '👦' },
  { value: 'お姉ちゃん', label: 'お姉ちゃん', emoji: '👧' },
  { value: '弟', label: '弟', emoji: '👦' },
  { value: '妹', label: '妹', emoji: '👧' },
  { value: 'おじいちゃん', label: 'おじいちゃん', emoji: '👴' },
  { value: 'おばあちゃん', label: 'おばあちゃん', emoji: '👵' },
  { value: 'その他', label: 'その他', emoji: '👤' },
];

export const getRelationEmoji = (relation: Relation): string => {
  const found = RELATIONS.find((r) => r.value === relation);
  return found?.emoji ?? '👤';
};
