import { storyStorageV1Schema } from '@/lib/story-schema';
import { removeExpiredStories, sortStoriesByCreatedAt } from '@/lib/story-utils';
import { STORY_STORAGE_KEY, type Story, type StoryStorageV1 } from '@/types/story';

export const MAX_STORY_STORAGE_BYTES = 4 * 1024 * 1024;

export type StoryRepositoryErrorCode = 'storage-unavailable' | 'storage-full' | 'read-failed' | 'write-failed';

export class StoryRepositoryError extends Error {
  constructor(
    public readonly code: StoryRepositoryErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'StoryRepositoryError';
  }
}

export type StoryRepository = {
  loadStories: (now?: number) => Story[];
  saveStories: (stories: readonly Story[]) => void;
  clearStories: () => void;
};

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

type StoryRepositoryOptions = {
  storage?: StorageLike;
  maximumBytes?: number;
};

function isQuotaExceededError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  );
}

function serializedSize(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

export function createStoryRepository(options: StoryRepositoryOptions = {}): StoryRepository {
  const maximumBytes = options.maximumBytes ?? MAX_STORY_STORAGE_BYTES;

  function getStorage(): StorageLike {
    if (options.storage) {
      return options.storage;
    }

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage;
      }
    } catch (error) {
      throw new StoryRepositoryError('storage-unavailable', '浏览器本地存储不可用。', { cause: error });
    }

    throw new StoryRepositoryError('storage-unavailable', '浏览器本地存储不可用。');
  }

  function clearStories(): void {
    try {
      getStorage().removeItem(STORY_STORAGE_KEY);
    } catch (error) {
      if (error instanceof StoryRepositoryError) {
        throw error;
      }

      throw new StoryRepositoryError('write-failed', '无法清空本地 Story。', { cause: error });
    }
  }

  function saveStories(stories: readonly Story[]): void {
    const payload: StoryStorageV1 = {
      version: 1,
      stories: sortStoriesByCreatedAt(stories),
    };
    const serialized = JSON.stringify(payload);

    if (serializedSize(serialized) > maximumBytes) {
      throw new StoryRepositoryError('storage-full', 'Story 占用空间已达到约 4 MB，请删除部分内容后重试。');
    }

    try {
      getStorage().setItem(STORY_STORAGE_KEY, serialized);
    } catch (error) {
      if (error instanceof StoryRepositoryError) {
        throw error;
      }

      if (isQuotaExceededError(error)) {
        throw new StoryRepositoryError('storage-full', '浏览器存储空间不足，请删除部分 Story 后重试。', {
          cause: error,
        });
      }

      throw new StoryRepositoryError('write-failed', 'Story 无法保存到浏览器。', { cause: error });
    }
  }

  function discardInvalidStorage(storage: StorageLike): void {
    try {
      storage.removeItem(STORY_STORAGE_KEY);
    } catch {
      // Invalid external data is ignored even when the browser refuses cleanup.
    }
  }

  function loadStories(now = Date.now()): Story[] {
    const storage = getStorage();
    let serialized: string | null;

    try {
      serialized = storage.getItem(STORY_STORAGE_KEY);
    } catch (error) {
      throw new StoryRepositoryError('read-failed', '无法读取浏览器中的 Story。', { cause: error });
    }

    if (serialized === null) {
      return [];
    }

    let externalData: unknown;

    try {
      externalData = JSON.parse(serialized);
    } catch {
      discardInvalidStorage(storage);
      return [];
    }

    const parsed = storyStorageV1Schema.safeParse(externalData);

    if (!parsed.success) {
      discardInvalidStorage(storage);
      return [];
    }

    const validStories = sortStoriesByCreatedAt(removeExpiredStories(parsed.data.stories, now));

    if (validStories.length !== parsed.data.stories.length) {
      saveStories(validStories);
    }

    return validStories;
  }

  return {
    loadStories,
    saveStories,
    clearStories,
  };
}

export const storyRepository = createStoryRepository();
