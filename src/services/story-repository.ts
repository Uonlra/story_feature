import { storyStorageV1Schema } from '@/lib/story-schema';
import { removeExpiredStories, sortStoriesByCreatedAt } from '@/lib/story-utils';
import { STORY_STORAGE_KEY, type Story } from '@/types/story';

const DATABASE_NAME = 'story-feature';
const DATABASE_VERSION = 1;
const STORIES_STORE = 'stories';
const ORIGINAL_IMAGES_STORE = 'original-images';

type OriginalImageRecord = {
  storyId: string;
  data: ArrayBuffer;
  mimeType: string;
};

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
  loadStories: (now?: number) => Promise<Story[]>;
  saveStory: (story: Story, originalBlob: Blob) => Promise<void>;
  saveStories: (stories: readonly Story[]) => Promise<void>;
  loadOriginalImage: (storyId: string) => Promise<Blob | null>;
  deleteStory: (storyId: string) => Promise<void>;
  clearStories: () => Promise<void>;
};

type StorageLike = Pick<Storage, 'getItem' | 'removeItem'>;

type StoryRepositoryOptions = {
  indexedDB?: IDBFactory;
  /** Optional v1 localStorage source used only for one-time migration. */
  storage?: StorageLike;
  databaseName?: string;
};

function isQuotaExceededError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  );
}

function getIndexedDb(options: StoryRepositoryOptions): IDBFactory {
  if (options.indexedDB) {
    return options.indexedDB;
  }

  if (typeof indexedDB !== 'undefined') {
    return indexedDB;
  }

  throw new StoryRepositoryError('storage-unavailable', '浏览器 IndexedDB 不可用。');
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'));
  });
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted.'));
  });
}

async function openDatabase(options: StoryRepositoryOptions): Promise<IDBDatabase> {
  let request: IDBOpenDBRequest;

  try {
    request = getIndexedDb(options).open(options.databaseName ?? DATABASE_NAME, DATABASE_VERSION);
  } catch (error) {
    if (error instanceof StoryRepositoryError) {
      throw error;
    }
    throw new StoryRepositoryError('storage-unavailable', '无法打开浏览器 IndexedDB。', { cause: error });
  }

  request.onupgradeneeded = () => {
    const database = request.result;
    if (!database.objectStoreNames.contains(STORIES_STORE)) {
      database.createObjectStore(STORIES_STORE, { keyPath: 'id' });
    }
    if (!database.objectStoreNames.contains(ORIGINAL_IMAGES_STORE)) {
      database.createObjectStore(ORIGINAL_IMAGES_STORE, { keyPath: 'storyId' });
    }
  };

  try {
    return await requestResult(request);
  } catch (error) {
    throw new StoryRepositoryError('read-failed', '无法打开浏览器中的 Story 数据库。', { cause: error });
  }
}

function normalizeStories(stories: readonly Story[], now: number): Story[] {
  return sortStoriesByCreatedAt(removeExpiredStories(stories, now)).map((story) => ({
    ...story,
    originalWidth: story.originalWidth ?? story.width,
    originalHeight: story.originalHeight ?? story.height,
  }));
}

async function readLegacyStories(storage: StorageLike, now: number): Promise<Story[] | null> {
  let serialized: string | null;
  try {
    serialized = storage.getItem(STORY_STORAGE_KEY);
  } catch (error) {
    throw new StoryRepositoryError('read-failed', '无法读取旧版浏览器中的 Story。', { cause: error });
  }

  if (serialized === null) {
    return null;
  }

  let externalData: unknown;
  try {
    externalData = JSON.parse(serialized);
  } catch {
    try {
      storage.removeItem(STORY_STORAGE_KEY);
    } catch {
      // Damaged legacy data can be ignored if cleanup is unavailable.
    }
    return [];
  }

  const parsed = storyStorageV1Schema.safeParse(externalData);
  if (!parsed.success) {
    try {
      storage.removeItem(STORY_STORAGE_KEY);
    } catch {
      // Damaged legacy data can be ignored if cleanup is unavailable.
    }
    return [];
  }

  const stories = normalizeStories(parsed.data.stories, now);
  try {
    storage.removeItem(STORY_STORAGE_KEY);
  } catch {
    // Migration remains valid even if the old key cannot be removed.
  }
  return stories;
}

export function createStoryRepository(options: StoryRepositoryOptions = {}): StoryRepository {
  let databasePromise: Promise<IDBDatabase> | undefined;

  function getDatabase(): Promise<IDBDatabase> {
    databasePromise ??= openDatabase(options);
    return databasePromise;
  }

  async function writeStories(database: IDBDatabase, stories: readonly Story[]): Promise<void> {
    const transaction = database.transaction([STORIES_STORE, ORIGINAL_IMAGES_STORE], 'readwrite');
    const metadataStore = transaction.objectStore(STORIES_STORE);
    const imageStore = transaction.objectStore(ORIGINAL_IMAGES_STORE);
    const nextStories = sortStoriesByCreatedAt(stories);
    const nextIds = new Set(nextStories.map((story) => story.id));
    const completion = transactionComplete(transaction);
    const keysRequest = imageStore.getAllKeys();

    keysRequest.onsuccess = () => {
      const existingImageKeys = keysRequest.result;

      metadataStore.clear();
      for (const story of nextStories) {
        metadataStore.put({
          ...story,
          originalWidth: story.originalWidth ?? story.width,
          originalHeight: story.originalHeight ?? story.height,
        });
      }
      for (const key of existingImageKeys) {
        if (typeof key === 'string' && !nextIds.has(key)) {
          imageStore.delete(key);
        }
      }
    };

    await completion;
  }

  async function loadStories(now = Date.now()): Promise<Story[]> {
    const database = await getDatabase();
    const transaction = database.transaction(STORIES_STORE, 'readonly');
    const completion = transactionComplete(transaction);
    const records = (await requestResult(transaction.objectStore(STORIES_STORE).getAll())) as Story[];
    await completion;

    let stories = records;
    if (records.length === 0 && options.storage) {
      const migrated = await readLegacyStories(options.storage, now);
      if (migrated !== null) {
        await writeStories(database, migrated);
        stories = migrated;
      }
    }

    const validStories = normalizeStories(stories, now);
    if (validStories.length !== stories.length) {
      await writeStories(database, validStories);
    }
    return validStories;
  }

  async function saveStory(story: Story, originalBlob: Blob): Promise<void> {
    const database = await getDatabase();
    const data = await originalBlob.arrayBuffer();
    const transaction = database.transaction([STORIES_STORE, ORIGINAL_IMAGES_STORE], 'readwrite');
    const completion = transactionComplete(transaction);
    transaction.objectStore(STORIES_STORE).put({
      ...story,
      originalWidth: story.originalWidth ?? story.width,
      originalHeight: story.originalHeight ?? story.height,
    });
    transaction.objectStore(ORIGINAL_IMAGES_STORE).put({ storyId: story.id, data, mimeType: originalBlob.type });

    try {
      await completion;
    } catch (error) {
      throw new StoryRepositoryError(
        isQuotaExceededError(error) ? 'storage-full' : 'write-failed',
        isQuotaExceededError(error) ? '浏览器存储空间不足，请删除部分 Story 后重试。' : 'Story 无法保存到浏览器。',
        { cause: error },
      );
    }
  }

  async function saveStories(stories: readonly Story[]): Promise<void> {
    const database = await getDatabase();
    try {
      await writeStories(database, stories);
    } catch (error) {
      throw new StoryRepositoryError(
        isQuotaExceededError(error) ? 'storage-full' : 'write-failed',
        isQuotaExceededError(error) ? '浏览器存储空间不足，请删除部分 Story 后重试。' : 'Story 无法保存到浏览器。',
        { cause: error },
      );
    }
  }

  async function loadOriginalImage(storyId: string): Promise<Blob | null> {
    const database = await getDatabase();
    const transaction = database.transaction(ORIGINAL_IMAGES_STORE, 'readonly');
    const completion = transactionComplete(transaction);
    const record = (await requestResult(transaction.objectStore(ORIGINAL_IMAGES_STORE).get(storyId))) as
      OriginalImageRecord | undefined;
    await completion;
    return record ? new Blob([record.data], { type: record.mimeType }) : null;
  }

  async function deleteStory(storyId: string): Promise<void> {
    const database = await getDatabase();
    const transaction = database.transaction([STORIES_STORE, ORIGINAL_IMAGES_STORE], 'readwrite');
    const completion = transactionComplete(transaction);
    transaction.objectStore(STORIES_STORE).delete(storyId);
    transaction.objectStore(ORIGINAL_IMAGES_STORE).delete(storyId);
    try {
      await completion;
    } catch (error) {
      throw new StoryRepositoryError('write-failed', 'Story 无法删除。', { cause: error });
    }
  }

  async function clearStories(): Promise<void> {
    const database = await getDatabase();
    const transaction = database.transaction([STORIES_STORE, ORIGINAL_IMAGES_STORE], 'readwrite');
    const completion = transactionComplete(transaction);
    transaction.objectStore(STORIES_STORE).clear();
    transaction.objectStore(ORIGINAL_IMAGES_STORE).clear();
    try {
      await completion;
    } catch (error) {
      throw new StoryRepositoryError('write-failed', '无法清空本地 Story。', { cause: error });
    }
  }

  return { loadStories, saveStory, saveStories, loadOriginalImage, deleteStory, clearStories };
}

export const storyRepository = createStoryRepository();
