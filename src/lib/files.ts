/** 파일 이름에 쓸 수 없는 글자를 정리합니다. */
export function safeFileName(...parts: string[]): string {
  const joined = parts
    .map((p) =>
      p
        .normalize('NFC')
        .replace(/[\\/:*?"<>|\u0000-\u001f\u007f]/g, ' ')
        .replace(/[​-‏‪-‮⁦-⁩﻿]/g, '')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter(Boolean)
    .join('_');
  let name = Array.from(joined).slice(0, 60).join('').replace(/[. ]+$/g, '');
  if (/^(con|prn|aux|nul|com\d|lpt\d)$/i.test(name)) name = `_${name}`;
  return name || '뉴턴인터뷰';
}

export function stamp(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
