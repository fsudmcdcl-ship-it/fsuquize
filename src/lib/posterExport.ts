import html2canvas from 'html2canvas';

export interface PosterExportOptions {
  element: HTMLElement;
  filename: string;
  format: 'jpg' | 'png';
  backgroundColor?: string;
  scale?: number;
}

/**
 * Pre-processes images inside an element to ensure cross-origin safety
 * and prevent HTML5 Canvas tainting.
 */
async function sanitizeImagesForExport(container: HTMLElement): Promise<void> {
  const images = Array.from(container.querySelectorAll('img'));
  
  const promises = images.map(async (img) => {
    try {
      const src = img.getAttribute('src');
      if (!src || src.startsWith('data:')) {
        return;
      }

      // Ensure crossOrigin attribute is set
      img.crossOrigin = 'anonymous';

      // For external URLs, attempt to load and convert to Base64 to avoid CORS taint
      if (src.startsWith('http://') || src.startsWith('https://')) {
        try {
          const response = await fetch(src, { mode: 'cors' });
          if (response.ok) {
            const blob = await response.blob();
            const dataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
            img.src = dataUrl;
          }
        } catch {
          // If fetch fails due to CORS, don't let it break the export
          img.crossOrigin = 'anonymous';
        }
      }
    } catch (e) {
      console.debug('Image pre-process notice:', e);
    }
  });

  await Promise.all(promises);
}

/**
 * Robustly exports a DOM node as a high-resolution JPEG or PNG file.
 */
export async function exportPosterToFile({
  element,
  filename,
  format,
  backgroundColor = '#090d16',
  scale = 2,
}: PosterExportOptions): Promise<{ success: boolean; error?: string }> {
  if (!element) {
    return { success: false, error: 'Poster element not found' };
  }

  try {
    // 1. Wait for web fonts (e.g. Mukta / Inter) to be ready
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    // 2. Pre-process images
    await sanitizeImagesForExport(element);

    // 3. Render canvas with html2canvas (strictly allowTaint: false to prevent export errors)
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: false,
      backgroundColor,
      logging: false,
      imageTimeout: 10000,
      onclone: (_clonedDoc, clonedEl) => {
        // Expand scrollable areas in the cloned document so all content is captured
        const scrollContainers = clonedEl.querySelectorAll('[class*="overflow-y-auto"], [class*="max-h-"]');
        scrollContainers.forEach((el) => {
          const htmlEl = el as HTMLElement;
          htmlEl.style.maxHeight = 'none';
          htmlEl.style.overflow = 'visible';
          htmlEl.style.height = 'auto';
        });
      },
    });

    const mime = format === 'png' ? 'image/png' : 'image/jpeg';
    const cleanFilename = filename.endsWith(`.${format}`) ? filename : `${filename}.${format}`;

    // 4. Download using Blob (preferred for large canvas) with dataURL fallback
    if (typeof canvas.toBlob === 'function') {
      await new Promise<void>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              try {
                // Fallback to toDataURL
                const dataUrl = canvas.toDataURL(mime, 0.95);
                triggerDownload(dataUrl, cleanFilename);
                resolve();
              } catch (fallbackErr) {
                reject(fallbackErr);
              }
              return;
            }

            const blobUrl = URL.createObjectURL(blob);
            triggerDownload(blobUrl, cleanFilename);
            setTimeout(() => {
              URL.revokeObjectURL(blobUrl);
              resolve();
            }, 1000);
          },
          mime,
          0.95
        );
      });
    } else {
      const dataUrl = canvas.toDataURL(mime, 0.95);
      triggerDownload(dataUrl, cleanFilename);
    }

    return { success: true };
  } catch (err: unknown) {
    console.error('Poster export failure details:', err);
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

function triggerDownload(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    if (document.body.contains(link)) {
      document.body.removeChild(link);
    }
  }, 100);
}
