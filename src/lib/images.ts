// 이미지 파일 검사·줄이기·자르기
import type { ImageInfo } from '../state/types';

export const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
export const MAX_INPUT_BYTES = 25 * 1024 * 1024;
const MAX_SIDE = 2000;

export class ImageError extends Error {}

async function decode(blob: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(blob, { imageOrientation: 'from-image' });
    } catch {
      /* 아래 방법으로 다시 시도 */
    }
  }
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function sizeOf(src: ImageBitmap | HTMLImageElement) {
  return 'naturalWidth' in src ? { w: src.naturalWidth, h: src.naturalHeight } : { w: src.width, h: src.height };
}

function canvasToBlob(c: HTMLCanvasElement, type: string, q: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    c.toBlob((b) => (b ? resolve(b) : reject(new ImageError('이미지를 바꾸는 중 문제가 생겼어요.'))), type, q),
  );
}

/** 올린 파일을 검사하고, 너무 크면 줄여서 JPEG로 만듭니다. */
export async function prepareImage(file: Blob): Promise<{ blob: Blob; width: number; height: number; resized: boolean }> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new ImageError('PNG, JPG, WEBP, GIF 이미지만 올릴 수 있어요. 다른 형식이면 PNG나 JPG로 저장한 뒤 다시 올려 주세요.');
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new ImageError('이미지 파일이 너무 커요(25MB 넘음). 더 작은 이미지를 골라 주세요.');
  }
  let src: ImageBitmap | HTMLImageElement;
  try {
    src = await decode(file);
  } catch {
    throw new ImageError('이미지를 열 수 없어요. 파일이 망가졌거나 이미지가 아닐 수 있어요.');
  }
  const { w, h } = sizeOf(src);
  if (!w || !h) throw new ImageError('이미지 크기를 알 수 없어요.');
  const scale = Math.min(1, MAX_SIDE / Math.max(w, h));
  const cw = Math.round(w * scale);
  const ch = Math.round(h * scale);
  const c = document.createElement('canvas');
  c.width = cw;
  c.height = ch;
  const ctx = c.getContext('2d');
  if (!ctx) throw new ImageError('이 브라우저에서는 이미지를 처리할 수 없어요.');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, cw, ch);
  ctx.drawImage(src, 0, 0, cw, ch);
  if ('close' in src) src.close();
  const blob = await canvasToBlob(c, 'image/jpeg', 0.88);
  return { blob, width: cw, height: ch, resized: scale < 1 || file.type !== 'image/jpeg' };
}

/** 신문 사진 틀의 가로:세로 비율 (cover일 때) */
export const FRAME_ASPECT = 4 / 3;

/**
 * 신문에 들어갈 이미지를 만듭니다.
 * cover: 틀(4:3)에 맞게 잘라냄. 자르는 위치는 CSS object-position(%)과 같은 계산.
 * contain: 원래 비율 그대로.
 */
export async function renderForPaper(blob: Blob, info: ImageInfo): Promise<{ dataUrl: string; aspect: number }> {
  const src = await decode(blob);
  const { w, h } = sizeOf(src);
  let sx = 0,
    sy = 0,
    sw = w,
    sh = h;
  if (info.fit === 'cover') {
    const imgAspect = w / h;
    if (imgAspect > FRAME_ASPECT) {
      sw = Math.round(h * FRAME_ASPECT);
      sx = Math.round(((w - sw) * info.focusX) / 100);
    } else {
      sh = Math.round(w / FRAME_ASPECT);
      sy = Math.round(((h - sh) * info.focusY) / 100);
    }
  }
  const scale = Math.min(1, 1600 / Math.max(sw, sh));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(sw * scale));
  c.height = Math.max(1, Math.round(sh * scale));
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(src, sx, sy, sw, sh, 0, 0, c.width, c.height);
  if ('close' in src) src.close();
  return { dataUrl: c.toDataURL('image/jpeg', 0.9), aspect: c.width / c.height };
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/.exec(dataUrl);
  if (!m) throw new ImageError('활동 파일 안의 이미지 형식이 올바르지 않아요.');
  const bin = atob(m[2].replace(/\s/g, ''));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: m[1] });
}
