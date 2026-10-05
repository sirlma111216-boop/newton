// 활동 파일(JSON) 저장·불러오기 — 이미지도 함께 담습니다.
import { blobToDataUrl, dataUrlToBlob, prepareImage } from '../lib/images';
import { loadImage } from './db';
import { sanitizeState } from './sanitize';
import type { AppState } from './types';

export const BACKUP_APP_ID = 'newton-interview-newspaper';
const MAX_BACKUP_BYTES = 40 * 1024 * 1024;

export interface BackupFile {
  app: typeof BACKUP_APP_ID;
  format: 1;
  savedAt: string;
  state: AppState;
  images: Record<string, string>;
}

export async function buildBackup(state: AppState): Promise<Blob> {
  const images: Record<string, string> = {};
  if (state.a2.image) {
    const b = await loadImage(state.a2.image.key);
    if (b) images[state.a2.image.key] = await blobToDataUrl(b);
  }
  const file: BackupFile = { app: BACKUP_APP_ID, format: 1, savedAt: new Date().toISOString(), state, images };
  return new Blob([JSON.stringify(file)], { type: 'application/json' });
}

export class BackupError extends Error {}

/** 파일을 검사해서 안전한 상태와 이미지로 바꿉니다. 저장은 하지 않습니다. */
export async function readBackup(file: File): Promise<{ state: AppState; images: Record<string, Blob>; warnings: string[] }> {
  if (file.size > MAX_BACKUP_BYTES) throw new BackupError('파일이 너무 커요. 이 웹앱에서 저장한 활동 파일인지 확인해 주세요.');
  if (!/\.json$/i.test(file.name) && file.type !== 'application/json') {
    throw new BackupError('활동 파일(.json)만 불러올 수 있어요.');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new BackupError('파일을 읽을 수 없어요. 이 웹앱에서 저장한 활동 파일이 맞는지 확인해 주세요.');
  }
  if (typeof parsed !== 'object' || parsed === null || (parsed as { app?: unknown }).app !== BACKUP_APP_ID) {
    throw new BackupError('「뉴턴 인터뷰 신문 제작소」의 활동 파일이 아니에요.');
  }
  const p = parsed as { format?: unknown; state?: unknown; images?: unknown };
  if (p.format !== 1) throw new BackupError('지원하지 않는 활동 파일 버전이에요.');
  const state = sanitizeState(p.state);
  if (!state) throw new BackupError('활동 파일의 내용이 올바르지 않아요.');

  const images: Record<string, Blob> = {};
  const warnings: string[] = [];
  if (state.a2.image) {
    const raw = typeof p.images === 'object' && p.images !== null ? (p.images as Record<string, unknown>)[state.a2.image.key] : undefined;
    if (typeof raw === 'string') {
      try {
        // 한 번 더 열어 보고 다시 저장해서, 이미지로 열리는 파일만 받아들입니다.
        const prepared = await prepareImage(await dataUrlToBlob(raw));
        images[state.a2.image.key] = prepared.blob;
        state.a2.image.width = prepared.width;
        state.a2.image.height = prepared.height;
      } catch {
        state.a2.image = null;
        warnings.push('활동 파일 안의 이미지를 열 수 없어서 이미지는 빼고 불러왔어요. 이미지를 다시 올려 주세요.');
      }
    } else {
      state.a2.image = null;
      warnings.push('활동 파일에 이미지가 들어 있지 않아 이미지는 빼고 불러왔어요.');
    }
  }
  return { state, images, warnings };
}
