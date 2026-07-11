/* ──────────────────────────────────────────────────────────────────────────
 * Extraction Rules Engine
 *
 * Pure-function, regex-based NLP extractors that run on raw text.
 * No external API calls — entirely self-contained.
 * ────────────────────────────────────────────────────────────────────────── */

import type {
  ExtractedField,
  ExtractedTable,
  DocumentType,
  FieldCategory,
} from './types';

/* ────────── helpers ────────── */

function pushField(
  fields: ExtractedField[],
  label: string,
  value: string,
  confidence: number,
  category: FieldCategory,
  offset?: number,
) {
  // Deduplicate identical label+value pairs
  if (fields.some((f) => f.label === label && f.value === value)) return;
  fields.push({ label, value, confidence, category, sourceOffset: offset });
}

/* ────────── DATE extraction ────────── */

const DATE_PATTERNS: { re: RegExp; label: string }[] = [
  // "January 5, 2024" / "Jan 5, 2024"
  {
    re: /\b(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+\d{1,2},?\s+\d{4}\b/gi,
    label: 'Date',
  },
  // "05/12/2024" or "05-12-2024"
  { re: /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g, label: 'Date' },
  // "2024-05-12"
  { re: /\b\d{4}-\d{2}-\d{2}\b/g, label: 'Date' },
];

export function extractDates(text: string): ExtractedField[] {
  const fields: ExtractedField[] = [];
  for (const pat of DATE_PATTERNS) {
    let match: RegExpExecArray | null;
    const regex = new RegExp(pat.re.source, pat.re.flags);
    while ((match = regex.exec(text)) !== null) {
      pushField(fields, pat.label, match[0].trim(), 0.9, 'date', match.index);
    }
  }
  return fields;
}

/* ────────── CURRENCY / AMOUNT extraction ────────── */

const AMOUNT_PATTERNS: { re: RegExp; label: string }[] = [
  // "$1,234.56" / "USD 1234" / "€500" / "₹10,000"
  { re: /[$€£¥₹]\s*[\d,]+(?:\.\d{1,2})?/g, label: 'Amount' },
  { re: /\b(?:USD|EUR|GBP|INR|JPY|AUD|CAD)\s*[\d,]+(?:\.\d{1,2})?/gi, label: 'Amount' },
  // "1,234.56 USD"
  { re: /[\d,]+(?:\.\d{1,2})?\s*(?:USD|EUR|GBP|INR|JPY|AUD|CAD)\b/gi, label: 'Amount' },
];

export function extractAmounts(text: string): ExtractedField[] {
  const fields: ExtractedField[] = [];
  for (const pat of AMOUNT_PATTERNS) {
    let match: RegExpExecArray | null;
    const regex = new RegExp(pat.re.source, pat.re.flags);
    while ((match = regex.exec(text)) !== null) {
      pushField(fields, pat.label, match[0].trim(), 0.85, 'amount', match.index);
    }
  }
  return fields;
}

/* ────────── EMAIL extraction ────────── */

export function extractEmails(text: string): ExtractedField[] {
  const fields: ExtractedField[] = [];
  const re = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    pushField(fields, 'Email', m[0], 0.95, 'email', m.index);
  }
  return fields;
}

/* ────────── PHONE extraction ────────── */

export function extractPhones(text: string): ExtractedField[] {
  const fields: ExtractedField[] = [];
  const patterns = [
    /\+?\d{1,3}[\s\-.]?\(?\d{2,4}\)?[\s\-.]?\d{3,4}[\s\-.]?\d{3,4}/g,
    /\(\d{3}\)\s*\d{3}[\s\-.]?\d{4}/g,
  ];
  for (const re of patterns) {
    const regex = new RegExp(re.source, re.flags);
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      const val = m[0].trim();
      if (val.replace(/\D/g, '').length >= 7) {
        pushField(fields, 'Phone', val, 0.8, 'phone', m.index);
      }
    }
  }
  return fields;
}

/* ────────── ORGANIZATION / PARTY extraction ────────── */

const ORG_SUFFIXES =
  /\b([A-Z][A-Za-z&\s]+(?:Inc\.?|LLC|Ltd\.?|Corp\.?|Co\.?|LLP|PLC|GmbH|S\.A\.?|Pvt\.?\s*Ltd\.?|Limited|Corporation|Company))\b/g;

export function extractOrganizations(text: string): ExtractedField[] {
  const fields: ExtractedField[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(ORG_SUFFIXES.source, ORG_SUFFIXES.flags);
  while ((m = re.exec(text)) !== null) {
    pushField(fields, 'Organization', m[1].trim(), 0.8, 'organization', m.index);
  }
  return fields;
}

/* ────────── IDENTIFIER extraction (invoice #, contract #, etc.) ────────── */

export function extractIdentifiers(text: string): ExtractedField[] {
  const fields: ExtractedField[] = [];
  const patterns: { re: RegExp; label: string }[] = [
    { re: /(?:Invoice|Inv)[\s#:.\-]*([A-Z0-9\-]{3,20})/gi, label: 'Invoice Number' },
    { re: /(?:Contract|Agreement)[\s#:.\-]*([A-Z0-9\-]{3,20})/gi, label: 'Contract Number' },
    { re: /(?:PO|Purchase\s*Order)[\s#:.\-]*([A-Z0-9\-]{3,20})/gi, label: 'PO Number' },
    { re: /(?:Reference|Ref)[\s#:.\-]*([A-Z0-9\-]{3,20})/gi, label: 'Reference Number' },
    { re: /(?:Policy)[\s#:.\-]*([A-Z0-9\-]{3,20})/gi, label: 'Policy Number' },
    { re: /(?:Account)[\s#:.\-]*([A-Z0-9\-]{3,20})/gi, label: 'Account Number' },
  ];
  for (const pat of patterns) {
    const regex = new RegExp(pat.re.source, pat.re.flags);
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      pushField(fields, pat.label, m[1].trim(), 0.85, 'identifier', m.index);
    }
  }
  return fields;
}

/* ────────── ADDRESS extraction (US-centric heuristic) ────────── */

export function extractAddresses(text: string): ExtractedField[] {
  const fields: ExtractedField[] = [];
  // US-style: "123 Main St, City, ST 12345"
  const re =
    /\d{1,5}\s+[\w\s.]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct|Circle|Cir|Place|Pl)\.?\s*,?\s*[\w\s]+,?\s*[A-Z]{2}\s*\d{5}(?:-\d{4})?/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    pushField(fields, 'Address', m[0].trim(), 0.7, 'address', m.index);
  }
  return fields;
}

/* ────────── KEY-VALUE pair extraction ────────── */

export function extractKeyValuePairs(text: string): ExtractedField[] {
  const fields: ExtractedField[] = [];
  // Matches lines like "Label: Value" or "Label - Value"
  const re = /^([A-Z][A-Za-z\s/]{2,30})[\s]*[:–\-]\s*(.{2,120})$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const label = m[1].trim();
    const value = m[2].trim();
    // Skip if value looks like a full sentence (likely body text, not a field)
    if (value.split(' ').length > 15) continue;
    pushField(fields, label, value, 0.65, 'general', m.index);
  }
  return fields;
}

/* ────────── TABLE detection ────────── */

export function extractTables(text: string): ExtractedTable[] {
  const tables: ExtractedTable[] = [];
  const lines = text.split('\n');

  let tableLines: string[] = [];
  let inTable = false;

  for (const line of lines) {
    // Heuristic: a "table row" has 2+ tab or multi-space separated columns
    const cells = line.split(/\t|  {2,}/).map((c) => c.trim()).filter(Boolean);
    if (cells.length >= 2) {
      if (!inTable) inTable = true;
      tableLines.push(line);
    } else {
      if (inTable && tableLines.length >= 2) {
        const parsed = tableLines.map((l) =>
          l.split(/\t|  {2,}/).map((c) => c.trim()).filter(Boolean),
        );
        tables.push({
          headers: parsed[0],
          rows: parsed.slice(1),
        });
      }
      tableLines = [];
      inTable = false;
    }
  }
  // Flush any remaining table
  if (inTable && tableLines.length >= 2) {
    const parsed = tableLines.map((l) =>
      l.split(/\t|  {2,}/).map((c) => c.trim()).filter(Boolean),
    );
    tables.push({ headers: parsed[0], rows: parsed.slice(1) });
  }

  return tables;
}

/* ────────── DOCUMENT TYPE classification ────────── */

const TYPE_KEYWORDS: Record<DocumentType, string[]> = {
  invoice: ['invoice', 'bill to', 'ship to', 'subtotal', 'total due', 'payment due', 'tax amount'],
  contract: ['agreement', 'contract', 'party', 'parties', 'obligations', 'term', 'governing law', 'whereas'],
  receipt: ['receipt', 'transaction', 'paid', 'change due', 'cashier', 'total paid'],
  letter: ['dear', 'sincerely', 'regards', 'to whom it may concern'],
  resume: ['experience', 'education', 'skills', 'objective', 'references', 'curriculum vitae', 'resume'],
  report: ['report', 'findings', 'analysis', 'conclusion', 'executive summary', 'methodology'],
  legal: ['hereby', 'jurisdiction', 'indemnification', 'liability', 'arbitration', 'plaintiff', 'defendant'],
  form: ['please fill', 'applicant', 'signature', 'date of birth', 'form', 'check one'],
  unknown: [],
};

export function classifyDocument(text: string): { type: DocumentType; confidence: number } {
  const lowerText = text.toLowerCase();
  let bestType: DocumentType = 'unknown';
  let bestScore = 0;

  for (const [type, keywords] of Object.entries(TYPE_KEYWORDS)) {
    if (type === 'unknown') continue;
    let score = 0;
    for (const kw of keywords) {
      // Count occurrences (capped per keyword to avoid single-keyword domination)
      const count = Math.min((lowerText.split(kw).length - 1), 3);
      score += count;
    }
    // Normalise against the keyword list length
    const normalised = score / (keywords.length * 2);
    if (normalised > bestScore) {
      bestScore = normalised;
      bestType = type as DocumentType;
    }
  }

  const confidence = Math.min(bestScore, 1);
  return { type: confidence > 0.15 ? bestType : 'unknown', confidence: Math.max(confidence, 0.1) };
}

/* ────────── SUMMARY generation ────────── */

export function generateSummary(text: string, maxSentences = 4): string {
  // Simple extractive summarisation: pick the first N non-trivial sentences.
  const sentences = text
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 30 && s.length < 500);

  if (sentences.length === 0) {
    return text.slice(0, 300).trim() + (text.length > 300 ? '…' : '');
  }

  return sentences.slice(0, maxSentences).join(' ');
}

/* ────────── MASTER orchestrator ────────── */

export function extractAllFields(text: string): ExtractedField[] {
  return [
    ...extractDates(text),
    ...extractAmounts(text),
    ...extractEmails(text),
    ...extractPhones(text),
    ...extractOrganizations(text),
    ...extractIdentifiers(text),
    ...extractAddresses(text),
    ...extractKeyValuePairs(text),
  ];
}
