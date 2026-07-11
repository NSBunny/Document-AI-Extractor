/* ──────────────────────────────────────────────────────────────────────────
 * Type definitions for the AI Document Extractor
 * ────────────────────────────────────────────────────────────────────────── */

/** A single key-value field extracted from the document. */
export interface ExtractedField {
  label: string;
  value: string;
  confidence: number; // 0 – 1
  category: FieldCategory;
  /** Where in the text this field was found (character offset). */
  sourceOffset?: number;
}

/** Broad categories for extracted fields. */
export type FieldCategory =
  | 'date'
  | 'amount'
  | 'name'
  | 'email'
  | 'phone'
  | 'address'
  | 'clause'
  | 'identifier'
  | 'organization'
  | 'general';

/** Detected document type. */
export type DocumentType =
  | 'invoice'
  | 'contract'
  | 'receipt'
  | 'letter'
  | 'resume'
  | 'report'
  | 'legal'
  | 'form'
  | 'unknown';

/** A table detected in the document. */
export interface ExtractedTable {
  /** Column headers (if detected). */
  headers: string[];
  /** Row data – each row is an array of cell values. */
  rows: string[][];
}

/** Metadata about the processed document. */
export interface DocumentMetadata {
  fileName: string;
  fileSize: number;
  mimeType: string;
  pageCount?: number;
  wordCount: number;
  characterCount: number;
}

/** Complete extraction result returned to the client. */
export interface ExtractionResult {
  documentType: DocumentType;
  rawText: string;
  summary: string;
  fields: ExtractedField[];
  tables: ExtractedTable[];
  metadata: DocumentMetadata;
  confidence: number; // overall confidence 0 – 1
  processedAt: string; // ISO timestamp
}

/** One entry in the extraction history (persisted to localStorage). */
export interface HistoryEntry {
  id: string;
  fileName: string;
  documentType: DocumentType;
  fieldCount: number;
  confidence: number;
  processedAt: string;
  /** We store the full result so users can revisit it. */
  result: ExtractionResult;
}

/** Upload / processing pipeline state. */
export type ProcessingStatus =
  | 'idle'
  | 'uploading'
  | 'extracting'
  | 'done'
  | 'error';

export interface AIModelConfig {
  provider: 'openai' | 'anthropic' | 'google';
  modelId: string;
  displayName: string;
}

export interface AppSettings {
  openaiKey: string;
  anthropicKey: string;
  googleKey: string;
  defaultModel: string;
}

export const AVAILABLE_MODELS: AIModelConfig[] = [
  { provider: 'google', modelId: 'gemini-2.0-flash', displayName: 'Gemini 2.0 Flash (Google)' },
  { provider: 'google', modelId: 'gemini-2.5-flash', displayName: 'Gemini 2.5 Flash (Google)' },
  { provider: 'openai', modelId: 'gpt-4o', displayName: 'GPT-4o (OpenAI)' },
  { provider: 'openai', modelId: 'gpt-4o-mini', displayName: 'GPT-4o Mini (OpenAI)' },
  { provider: 'anthropic', modelId: 'claude-3-5-sonnet-latest', displayName: 'Claude 3.5 Sonnet (Anthropic)' },
];

