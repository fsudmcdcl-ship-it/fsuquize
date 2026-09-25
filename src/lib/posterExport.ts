import html2canvas from 'html2canvas-pro';

export interface PosterExportOptions {
  element: HTMLElement;
  filename: string;
  format: 'jpg' | 'png';
  backgroundColor?: string;
  scale?: number;
}

/**
 * Robust mathematical converter from CSS OKLCH color strings to standard RGB/RGBA strings.
 * This completely prevents html2canvas and other canvas rendering engines from throwing:
 * Attempting to parse an unsupported color function "oklch"
 */
export function oklchToRgbString(oklchStr: string): string {
  if (!oklchStr || !oklchStr.includes('oklch')) return oklchStr;

  return oklchStr.replace(/oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)/gi, (match, rawL, rawC, rawH, rawA) => {
    try {
      let L = rawL.endsWith('%') ? parseFloat(rawL) / 100 : parseFloat(rawL);
      const C = parseFloat(rawC);
      const H = parseFloat(rawH);
      const A = rawA ? (rawA.endsWith('%') ? parseFloat(rawA) / 100 : parseFloat(rawA)) : 1;

      // H in radians
      const hRad = (H * Math.PI) / 180;
      const a = C * Math.cos(hRad);
      const b = C * Math.sin(hRad);

      // OKLab to linear RGB
      const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
      const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
      const s_ = L - 0.0894841775 * a - 1.291485548 * b;

      const l = l_ * l_ * l_;
      const m = m_ * m_ * m_;
      const s = s_ * s_ * s_;

      const rLinear = +4.0767434036 * l - 3.3077115913 * m + 0.2309699292 * s;
      const gLinear = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
      const bLinear = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

      // Gamma transfer function to standard sRGB
      const toSRGB = (c: number) => {
        const clamped = Math.max(0, Math.min(1, c));
        return clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
      };

      const R = Math.round(toSRGB(rLinear) * 255);
      const G = Math.round(toSRGB(gLinear) * 255);
      const B = Math.round(toSRGB(bLinear) * 255);

      if (A < 1) {
        return `rgba(${R}, ${G}, ${B}, ${A})`;
      }
      return `rgb(${R}, ${G}, ${B})`;
    } catch {
      return match;
    }
  });
}

/**
 * Traverses stylesheets and elements in the cloned document to purge unsupported oklch color declarations
 */
function sanitizeClonedDocumentColors(clonedDoc: Document, clonedEl: HTMLElement): void {
  // 1. Sanitize all <style> elements in clonedDoc
  const styleTags = clonedDoc.querySelectorAll('style');
  styleTags.forEach(styleTag => {
    if (styleTag.textContent && styleTag.textContent.includes('oklch')) {
      styleTag.textContent = oklchToRgbString(styleTag.textContent);
    }
  });

  // 2. Color properties to check and convert
  const colorProps: string[] = [
    'color',
    'background-color',
    'border-color',
    'border-top-color',
    'border-bottom-color',
    'border-left-color',
    'border-right-color',
    'outline-color',
    'box-shadow',
    'text-shadow',
    'fill',
    'stroke',
  ];

  // 3. Inspect cloned root element and all children
  const elements = [clonedEl, ...Array.from(clonedEl.querySelectorAll('*'))] as HTMLElement[];
  elements.forEach(el => {
    if (!el || !el.style) return;

    try {
      const computed = window.getComputedStyle(el);
      colorProps.forEach(prop => {
        const val = computed.getPropertyValue(prop);
        if (val && val.includes('oklch')) {
          const converted = oklchToRgbString(val);
          el.style.setProperty(prop, converted, 'important');
        }
      });

      // Also sanitize any inline styles containing oklch
      const inlineStyle = el.getAttribute('style');
      if (inlineStyle && inlineStyle.includes('oklch')) {
        el.setAttribute('style', oklchToRgbString(inlineStyle));
      }
    } catch {
      // ignore
    }
  });
}

/**
 * Pre-processes images inside an element to ensure cross-origin safety
 * and prevent HTML5 Canvas tainting.
 */
async function sanitizeImagesForExport(container: HTMLElement): Promise<void> {
  const images = Array.from(container.querySelectorAll('img'));

  const promises = images.map(async img => {
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
      onclone: (clonedDoc, clonedEl) => {
        // Deeply sanitize oklch color declarations in cloned stylesheets & element computed styles
        sanitizeClonedDocumentColors(clonedDoc, clonedEl);

        // Expand scrollable areas in the cloned document so all content is captured
        const scrollContainers = clonedEl.querySelectorAll('[class*="overflow-y-auto"], [class*="max-h-"]');
        scrollContainers.forEach(el => {
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
          blob => {
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
