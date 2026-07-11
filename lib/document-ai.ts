/* ──────────────────────────────────────────────────────────────────────────
 * Document AI Engine
 *
 * Server-side orchestrator that:
 *  1. Parses the uploaded file (PDF / DOCX / TXT / image)
 *  2. Runs extraction rules on the text
 *  3. Returns a complete ExtractionResult
 *
 * Uses only free, bundled tools — zero API keys required.
 * ────────────────────────────────────────────────────────────────────────── */

import { parseDocument } from './document-parser';
import {
  extractAllFields,
  extractTables,
  classifyDocument,
  generateSummary,
} from './extraction-rules';
import type { ExtractionResult, DocumentMetadata } from './types';

/**
 * Main extraction pipeline.
 *
 * @param buffer   Raw file bytes
 * @param fileName Original file name
 * @param mimeType MIME type of the uploaded file
 * @returns Fully structured ExtractionResult
 */
export async function extractDocument(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
): Promise<ExtractionResult> {
  /* ── 1. Text extraction ─────────────────────────────────────────────── */
  const parsed = await parseDocument(buffer, fileName, mimeType);
  const rawText = parsed.text;

  /* ── 2. Field extraction ────────────────────────────────────────────── */
  const fields = extractAllFields(rawText);

  /* ── 3. Table detection ─────────────────────────────────────────────── */
  const tables = extractTables(rawText);

  /* ── 4. Document classification ─────────────────────────────────────── */
  const { type: documentType, confidence: typeConfidence } =
    classifyDocument(rawText);

  /* ── 5. Summary ─────────────────────────────────────────────────────── */
  const summary = generateSummary(rawText);

  /* ── 6. Metadata ────────────────────────────────────────────────────── */
  const words = rawText.split(/\s+/).filter(Boolean);
  const metadata: DocumentMetadata = {
    fileName,
    fileSize: buffer.byteLength,
    mimeType,
    pageCount: parsed.pages,
    wordCount: words.length,
    characterCount: rawText.length,
  };

  /* ── 7. Overall confidence ──────────────────────────────────────────── */
  const fieldConfidences = fields.map((f) => f.confidence);
  const avgFieldConf =
    fieldConfidences.length > 0
      ? fieldConfidences.reduce((a, b) => a + b, 0) / fieldConfidences.length
      : 0.5;
  const overallConfidence = Math.round(((typeConfidence + avgFieldConf) / 2) * 100) / 100;

  return {
    documentType,
    rawText,
    summary,
    fields,
    tables,
    metadata,
    confidence: overallConfidence,
    processedAt: new Date().toISOString(),
  };
}
