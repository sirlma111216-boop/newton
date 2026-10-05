// 만들어진 PDF를 그대로 그려서 미리보기로 보여 줍니다(미리보기 = PDF).
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';

let workerReady: Promise<void> | null = null;
/** 오프라인 한 파일 버전에서는 worker가 data: 주소로 들어 있어서, blob 주소로 바꿔 씁니다. */
function setupWorker(): Promise<void> {
  if (!workerReady) {
    workerReady = (async () => {
      if (workerUrl.startsWith('data:')) {
        const blob = await (await fetch(workerUrl)).blob();
        pdfjs.GlobalWorkerOptions.workerSrc = URL.createObjectURL(new Blob([blob], { type: 'text/javascript' }));
      } else {
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
      }
    })();
  }
  return workerReady;
}

export async function renderPdfToCanvases(blob: Blob, cssWidth: number): Promise<HTMLCanvasElement[]> {
  await setupWorker();
  const data = new Uint8Array(await blob.arrayBuffer());
  const task = pdfjs.getDocument({ data });
  const doc = await task.promise;
  const out: HTMLCanvasElement[] = [];
  try {
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const base = page.getViewport({ scale: 1 });
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const scale = (cssWidth / base.width) * ratio;
      const vp = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(vp.width);
      canvas.height = Math.floor(vp.height);
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${Math.floor(vp.height / ratio)}px`;
      const ctx = canvas.getContext('2d')!;
      await page.render({ canvasContext: ctx, viewport: vp, canvas }).promise;
      out.push(canvas);
    }
  } finally {
    void task.destroy();
  }
  return out;
}
