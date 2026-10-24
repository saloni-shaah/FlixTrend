import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from 'firebase/storage';
import { app } from '@/utils/firebaseClient';

const db = getFirestore(app);
const storage = getStorage(app);

const FILE_FIELDS = ['thumbnailFile', 'subtitleFile', 'backgroundAudio'] as const;
const FILE_ARRAY_FIELDS = ['files', 'mediaFiles'] as const;

type DraftAsset = {
  path: string;
  name: string;
  type: string;
  lastModified: number;
};

type PersistDraftOptions = {
  status: 'draft' | 'scheduled';
  publishAt?: Date | null;
};

function isFile(value: unknown): value is File {
  return typeof File !== 'undefined' && value instanceof File;
}

function serializeValue(value: any): any {
  if (isFile(value) || value instanceof Blob || typeof value === 'function') return undefined;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' && (value.startsWith('blob:') || value.startsWith('data:'))) return undefined;
  if (Array.isArray(value)) return value.map(serializeValue).filter((item) => item !== undefined);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, item]) => [key, serializeValue(item)] as const)
        .filter(([, item]) => item !== undefined),
    );
  }
  return value;
}

async function saveAsset(
  userId: string,
  draftId: string,
  key: string,
  file: File,
): Promise<DraftAsset> {
  if (file.size >= 250 * 1024 * 1024) {
    throw new Error(`“${file.name}” is too large to save as a cloud draft (maximum 250 MB).`);
  }
  const path = `drafts/${userId}/${draftId}/${key}`;
  await uploadBytes(ref(storage, path), file, { contentType: file.type || 'application/octet-stream' });
  return {
    path,
    name: file.name,
    type: file.type,
    lastModified: file.lastModified,
  };
}

export async function savePostDraft(
  userId: string,
  postData: Record<string, any>,
  options: PersistDraftOptions,
) {
  const draftsRef = collection(db, 'users', userId, 'drafts');
  const draftId = postData.draftId || doc(draftsRef).id;
  const draftRef = doc(draftsRef, draftId);
  const previousSnapshot = await getDoc(draftRef);
  const previousAssets = (previousSnapshot.data()?.assets || {}) as Record<string, DraftAsset>;
  const assets: Record<string, DraftAsset> = {};
  const uploadedPaths: string[] = [];

  try {
    for (const field of FILE_FIELDS) {
      if (isFile(postData[field])) {
        assets[field] = await saveAsset(userId, draftId, field, postData[field]);
        uploadedPaths.push(assets[field].path);
      }
    }

    for (const field of FILE_ARRAY_FIELDS) {
      const files = Array.isArray(postData[field]) ? postData[field] : [];
      for (let index = 0; index < files.length; index += 1) {
        if (!isFile(files[index])) continue;
        const key = `${field}_${index}`;
        assets[key] = await saveAsset(userId, draftId, key, files[index]);
        uploadedPaths.push(assets[key].path);
      }
    }

    const clips = Array.isArray(postData.draftClips) ? postData.draftClips : [];
    const savedClips = [];
    for (let index = 0; index < clips.length; index += 1) {
      const clip = clips[index];
      if (!isFile(clip.file)) continue;
      const key = `clip_${index}`;
      assets[key] = await saveAsset(userId, draftId, key, clip.file);
      uploadedPaths.push(assets[key].path);
      savedClips.push({
        id: clip.id,
        duration: clip.duration,
        start: clip.start,
        end: clip.end,
        width: clip.width,
        height: clip.height,
        assetKey: key,
      });
    }

    const data = serializeValue(postData) || {};
    for (const field of [...FILE_FIELDS, ...FILE_ARRAY_FIELDS, 'draftClips', 'editedFile', 'editedThumbnailFile']) {
      delete data[field];
    }
    data.draftClips = savedClips;

    const nextPublishAt = options.status === 'scheduled' && options.publishAt
      ? Timestamp.fromDate(options.publishAt)
      : null;

    await setDoc(draftRef, {
      userId,
      postType: postData.postType,
      title: postData.draftTitle || postData.content || postData.caption || postData.question || 'Untitled draft',
      status: options.status,
      publishAt: nextPublishAt,
      data,
      assets,
      createdAt: previousSnapshot.exists() ? previousSnapshot.data().createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const retainedPaths = new Set(Object.values(assets).map((asset) => asset.path));
    const obsoleteAssets = Object.values(previousAssets).filter((asset) => !retainedPaths.has(asset.path));
    const cleanupFailures: string[] = [];
    for (const asset of obsoleteAssets) {
      try {
        await deleteObject(ref(storage, asset.path));
      } catch (error) {
        console.error(`Could not remove superseded draft media at ${asset.path}:`, error);
        cleanupFailures.push(asset.path);
      }
    }

    return { id: draftId, cleanupFailures };
  } catch (error) {
    const oldPaths = new Set(Object.values(previousAssets).map((asset) => asset.path));
    await Promise.all(uploadedPaths
      .filter((path) => !oldPaths.has(path))
      .map(async (path) => {
        try {
          await deleteObject(ref(storage, path));
        } catch (cleanupError) {
          console.error(`Could not clean up incomplete draft upload at ${path}:`, cleanupError);
        }
      }));
    throw error;
  }
}

async function restoreAsset(asset: DraftAsset): Promise<{ file: File; url: string }> {
  const response = await fetch(await getDownloadURL(ref(storage, asset.path)));
  if (!response.ok) throw new Error(`Could not download saved media “${asset.name}”.`);
  const blob = await response.blob();
  const file = new File([blob], asset.name, {
    type: asset.type || blob.type,
    lastModified: asset.lastModified,
  });
  return { file, url: URL.createObjectURL(file) };
}

export async function loadPostDraft(userId: string, draftId: string) {
  const snapshot = await getDoc(doc(db, 'users', userId, 'drafts', draftId));
  if (!snapshot.exists()) throw new Error('The selected cloud draft could not be found.');

  const saved = snapshot.data();
  if (saved.userId !== userId) throw new Error('You do not have access to this draft.');

  const assets = (saved.assets || {}) as Record<string, DraftAsset>;
  const restoredAssets: Record<string, { file: File; url: string }> = {};
  for (const [key, asset] of Object.entries(assets)) {
    restoredAssets[key] = await restoreAsset(asset);
  }

  const data = { ...(saved.data || {}), postType: saved.postType, draftId };
  for (const field of FILE_FIELDS) {
    const restored = restoredAssets[field];
    data[field] = restored?.file || null;
    if (field === 'thumbnailFile' && restored) data.thumbnailUrl = restored.url;
    if (field === 'subtitleFile' && restored) data.subtitleUrl = restored.url;
    if (field === 'backgroundAudio' && restored) data.backgroundAudioName = restored.file.name;
  }

  for (const field of FILE_ARRAY_FIELDS) {
    const files = Object.keys(restoredAssets)
      .filter((key) => key.startsWith(`${field}_`))
      .sort((left, right) => Number(left.slice(field.length + 1)) - Number(right.slice(field.length + 1)))
      .map((key) => restoredAssets[key]);
    data[field] = files.map(({ file }) => file);
    if (files.length) data.mediaUrl = files.map(({ url }) => url);
  }

  data.draftClips = (data.draftClips || []).map((clip: any) => {
    const restored = restoredAssets[clip.assetKey];
    if (!restored) throw new Error('A source clip for this draft is missing.');
    return { ...clip, file: restored.file, url: restored.url };
  });
  data.mediaItems = data.draftClips.map((clip: any) => ({
    name: clip.file.name,
    start: clip.start,
    end: clip.end,
  }));
  data.editedFile = null;
  data.editedThumbnailFile = null;
  data.editedIsVideo = false;
  data.editedDuration = null;
  data.scheduleDate = saved.publishAt?.toDate?.() || undefined;

  return {
    data,
    status: saved.status as 'draft' | 'scheduled',
    publishAt: saved.publishAt?.toDate?.() || null,
  };
}

export async function deletePostDraft(userId: string, draftId: string) {
  const draftRef = doc(db, 'users', userId, 'drafts', draftId);
  const snapshot = await getDoc(draftRef);
  if (!snapshot.exists()) return [];

  const assets = (snapshot.data().assets || {}) as Record<string, DraftAsset>;
  await deleteDoc(draftRef);

  const failures: string[] = [];
  for (const asset of Object.values(assets)) {
    try {
      await deleteObject(ref(storage, asset.path));
    } catch (error) {
      console.error(`Could not remove deleted draft media at ${asset.path}:`, error);
      failures.push(asset.path);
    }
  }
  return failures;
}
