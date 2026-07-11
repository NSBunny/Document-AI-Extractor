/**
 * Document text extraction utilities.
 * Supports PDF, DOCX, TXT, and image files (via Tesseract.js OCR).
 */

export interface ParsedDocument {
  text: string;
  pages?: number;
  metadata?: Record<string, string>;
}

const SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.png', '.jpg', '.jpeg', '.tiff', '.tif', '.webp'] as const;

const MIME_MAP: Record<string, (typeof SUPPORTED_EXTENSIONS)[number]> = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'text/plain': '.txt',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/tiff': '.tiff',
  'image/webp': '.webp',
};

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.tiff', '.tif', '.webp']);

/**
 * Returns the list of supported file extensions.
 */
export function getSupportedFormats(): string[] {
  return [...SUPPORTED_EXTENSIONS];
}

/**
 * Resolves the effective file extension from the file name or MIME type.
 */
function resolveExtension(fileName: string, mimeType: string): string {
  const extMatch = fileName.match(/\.(\w+)$/i);
  if (extMatch) {
    const ext = `.${extMatch[1].toLowerCase()}`;
    if ((SUPPORTED_EXTENSIONS as readonly string[]).includes(ext)) {
      return ext;
    }
  }

  const mapped = MIME_MAP[mimeType.toLowerCase()];
  if (mapped) {
    return mapped;
  }

  throw new Error(
    `Unsupported file type: "${fileName}" (MIME: ${mimeType}). ` +
    `Supported formats: ${SUPPORTED_EXTENSIONS.join(', ')}`,
  );
}

/**
 * Parses a document buffer and extracts its text content.
 *
 * @param buffer  - The raw file content as a Buffer.
 * @param fileName - The original file name (used for extension detection).
 * @param mimeType - The MIME type of the file.
 * @returns Parsed document with text content and optional metadata.
 */
export async function parseDocument(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
): Promise<ParsedDocument> {
  const ext = resolveExtension(fileName, mimeType);

  /* ── Image files → OCR via Tesseract.js ──────────────────────────── */
  if (IMAGE_EXTENSIONS.has(ext)) {
    try {
      const Tesseract = await import('tesseract.js');
      const { data } = await Tesseract.recognize(buffer, 'eng');

      if (!data.text || data.text.trim().length === 0) {
        throw new Error(
          `No text could be extracted from image "${fileName}". The image may be blank or unreadable.`,
        );
      }

      return {
        text: data.text,
        metadata: {
          confidence: `${Math.round(data.confidence)}%`,
          ocrEngine: 'Tesseract.js',
        },
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('No text could be extracted')) {
        throw error;
      }
      throw new Error(
        `Failed to OCR image "${fileName}": ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  switch (ext) {
    case '.pdf': {
      try {
        const { PDFParse } = await import('pdf-parse/node');
        const parser = new PDFParse({ data: buffer });
        
        let text = '';
        let numpages: number | undefined;
        let info: any = null;

        try {
          const textResult = await parser.getText();
          text = textResult.text;
          const infoResult = await parser.getInfo().catch(() => null);
          if (infoResult) {
            numpages = infoResult.total;
            info = infoResult.info;
          }
        } finally {
          await parser.destroy().catch(() => null);
        }

        if (!text || text.trim().length === 0) {
          // Fallback to OCR for scanned PDFs
          try {
            const Tesseract = await import('tesseract.js');
            const { data: ocrData } = await Tesseract.recognize(buffer, 'eng');
            if (ocrData.text && ocrData.text.trim().length > 0) {
              return {
                text: ocrData.text,
                pages: numpages,
                metadata: {
                  title: info?.Title ?? '',
                  author: info?.Author ?? '',
                  extractionMethod: 'OCR (Tesseract.js)',
                },
              };
            }
          } catch {
            // OCR fallback failed too
          }

          throw new Error(
            'The PDF appears to contain no extractable text. It may be a scanned/image-only PDF that could not be processed.',
          );
        }

        return {
          text,
          pages: numpages,
          metadata: {
            title: info?.Title ?? '',
            author: info?.Author ?? '',
            creator: info?.Creator ?? '',
            extractionMethod: 'Direct text extraction',
          },
        };
      } catch (error) {
        if (error instanceof Error && error.message.includes('no extractable text')) {
          throw error;
        }
        throw new Error(
          `Failed to parse PDF file "${fileName}": ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    case '.docx': {
      try {
        const mammothModule = await import('mammoth');
        const mammoth = (mammothModule as any).default || mammothModule;
        const result = await mammoth.extractRawText({ buffer });

        if (!result.value || result.value.trim().length === 0) {
          throw new Error(
            `The DOCX file "${fileName}" appears to contain no text content.`,
          );
        }

        return {
          text: result.value,
          metadata: {
            extractionMethod: 'mammoth',
            warnings: result.messages.map((m: any) => m.message).join('; ') || 'None',
          },
        };
      } catch (error) {
        if (error instanceof Error && error.message.includes('no text content')) {
          throw error;
        }
        throw new Error(
          `Failed to parse DOCX file "${fileName}": ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    case '.txt': {
      const text = buffer.toString('utf-8');

      if (!text || text.trim().length === 0) {
        throw new Error(`The text file "${fileName}" is empty.`);
      }

      return {
        text,
        metadata: {
          encoding: 'utf-8',
          size: `${buffer.byteLength} bytes`,
          extractionMethod: 'Plain text',
        },
      };
    }

    default:
      throw new Error(
        `Unsupported file extension "${ext}". Supported formats: ${SUPPORTED_EXTENSIONS.join(', ')}`,
      );
  }
}
