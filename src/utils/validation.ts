import { z } from 'zod';
import { Config } from '@constants/config';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .email('メールアドレスの形式が正しくありません'),
  password: z
    .string()
    .min(1, 'パスワードを入力してください')
    .min(Config.password.minLength, `パスワードは${Config.password.minLength}文字以上で入力してください`),
});

export const signUpSchema = z.object({
  displayName: z
    .string()
    .min(1, '名前を入力してください')
    .max(50, '名前は50文字以内で入力してください'),
  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .email('メールアドレスの形式が正しくありません'),
  password: z
    .string()
    .min(1, 'パスワードを入力してください')
    .min(Config.password.minLength, `パスワードは${Config.password.minLength}文字以上で入力してください`)
    .regex(/[a-zA-Z]/, 'パスワードには英字を含めてください')
    .regex(/[0-9]/, 'パスワードには数字を含めてください'),
  confirmPassword: z.string().min(1, 'パスワード（確認）を入力してください'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'パスワードが一致しません',
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .email('メールアドレスの形式が正しくありません'),
});

export const postSchema = z.object({
  title: z
    .string()
    .min(1, 'タイトルを入力してください')
    .max(Config.post.maxTitleLength, `タイトルは${Config.post.maxTitleLength}文字以内で入力してください`),
  content: z
    .string()
    .min(1, '本文を入力してください')
    .max(Config.post.maxContentLength, `本文は${Config.post.maxContentLength}文字以内で入力してください`),
});

export const commentSchema = z.object({
  content: z
    .string()
    .min(1, 'コメントを入力してください')
    .max(Config.comment.maxContentLength, `コメントは${Config.comment.maxContentLength}文字以内で入力してください`),
});

export const familySchema = z.object({
  name: z
    .string()
    .min(1, 'ファミリー名を入力してください')
    .max(50, 'ファミリー名は50文字以内で入力してください'),
  description: z
    .string()
    .max(200, '説明は200文字以内で入力してください')
    .optional(),
});

export const createFamilySchema = z.object({
  name: z
    .string()
    .min(1, 'ファミリー名を入力してください')
    .max(50, 'ファミリー名は50文字以内で入力してください'),
  description: z
    .string()
    .max(200, '説明は200文字以内で入力してください')
    .optional(),
  relation: z
    .string()
    .min(1, '続柄を選択してください'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type PostFormData = z.infer<typeof postSchema>;
export type CommentFormData = z.infer<typeof commentSchema>;
export type FamilyFormData = z.infer<typeof familySchema>;
export type CreateFamilyFormData = z.infer<typeof createFamilySchema>;

// Update family schema is the same as family schema
export const updateFamilySchema = familySchema;
export type UpdateFamilyFormData = z.infer<typeof updateFamilySchema>;
