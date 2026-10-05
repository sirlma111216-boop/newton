// 브라우저 안의 저장소(IndexedDB). 서버로 보내지 않습니다.
import { createStore, del, get, set, clear } from 'idb-keyval';

const store = createStore('newton-interview-newspaper', 'data');
const STATE_KEY = 'state';

export async function loadStateRaw(): Promise<unknown> {
  return get(STATE_KEY, store);
}

export async function saveStateRaw(state: unknown): Promise<void> {
  await set(STATE_KEY, state, store);
}

export async function saveImage(key: string, blob: Blob): Promise<void> {
  await set(`img:${key}`, blob, store);
}

export async function loadImage(key: string): Promise<Blob | undefined> {
  const v = await get(`img:${key}`, store);
  return v instanceof Blob ? v : undefined;
}

export async function deleteImage(key: string): Promise<void> {
  await del(`img:${key}`, store);
}

export async function clearAll(): Promise<void> {
  await clear(store);
  try {
    localStorage.removeItem('newton-reporter-hint');
  } catch {
    /* 무시 */
  }
}
