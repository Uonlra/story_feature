import { z } from 'zod';

import { STORY_LIFETIME_MS, type Story, type StoryStorageV1 } from '@/types/story';

export const storyMimeTypeSchema = z.enum(['image/jpeg', 'image/png', 'image/webp']);

export const storySchema: z.ZodType<Story> = z
  .object({
    id: z.string().min(1),
    imageDataUrl: z.string().min(1),
    mimeType: storyMimeTypeSchema,
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    originalWidth: z.number().int().positive().optional(),
    originalHeight: z.number().int().positive().optional(),
    createdAt: z.number().int().nonnegative(),
    expiresAt: z.number().int().nonnegative(),
  })
  .strict()
  .superRefine((story, context) => {
    if (!story.imageDataUrl.startsWith(`data:${story.mimeType};base64,`)) {
      context.addIssue({
        code: 'custom',
        path: ['imageDataUrl'],
        message: '图片 Data URL 与 MIME 类型不匹配。',
      });
    }

    if (story.expiresAt !== story.createdAt + STORY_LIFETIME_MS) {
      context.addIssue({
        code: 'custom',
        path: ['expiresAt'],
        message: 'Story 过期时间无效。',
      });
    }
  });

export const storyStorageV1Schema: z.ZodType<StoryStorageV1> = z
  .object({
    version: z.literal(1),
    stories: z.array(storySchema),
  })
  .strict();
