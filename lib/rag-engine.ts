import { generateText } from 'ai';
import { createLanguageModel, type ApiKeys } from './ai-engine';
import type { AIModelConfig } from './types';

/**
 * Splits text into overlapping chunks of a given size.
 */
export function chunkText(text: string, size: number = 600, overlap: number = 150): string[] {
  if (!text || text.trim().length === 0) return [];
  
  const chunks: string[] = [];
  let startIndex = 0;
  
  while (startIndex < text.length) {
    const chunk = text.slice(startIndex, startIndex + size);
    if (chunk.trim().length > 0) {
      chunks.push(chunk.trim());
    }
    
    // Move starting index by size minus overlap
    startIndex += (size - overlap);
    
    // Safety check to prevent infinite loop
    if (size <= overlap) {
      startIndex += size;
    }
  }
  
  return chunks;
}

// Simple list of common English stopwords to filter out for keyword search
const STOPWORDS = new Set([
  'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'to', 'of', 'for', 'in', 'with',
  'this', 'that', 'these', 'those', 'then', 'here', 'there', 'it', 'its', 'they', 'them', 'their',
  'shall', 'will', 'should', 'would', 'can', 'could', 'may', 'might', 'must', 'has', 'have', 'had',
  'be', 'been', 'being', 'am', 'are', 'was', 'were', 'do', 'does', 'did', 'done', 'doing', 'i', 'you',
  'he', 'she', 'we', 'us', 'our', 'your', 'his', 'her', 'itself', 'themselves', 'yourself', 'ourselves'
]);

/**
 * Tokenizes text into a clean bag of words, lowercased and filtered of stopwords.
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // replace punctuation with spaces
    .split(/\s+/)
    .filter(word => word.length > 1 && !STOPWORDS.has(word));
}

/**
 * Retrieves the top k most relevant chunks matching a query using term-frequency cosine similarity.
 */
export function retrieveRelevantChunks(query: string, chunks: string[], k: number = 4): string[] {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0 || chunks.length === 0) {
    return chunks.slice(0, k);
  }

  // Create query frequency map and query magnitude
  const queryFreq: Record<string, number> = {};
  for (const token of queryTokens) {
    queryFreq[token] = (queryFreq[token] || 0) + 1;
  }
  
  let queryMagnitudeSq = 0;
  for (const term in queryFreq) {
    queryMagnitudeSq += queryFreq[term] * queryFreq[term];
  }
  const queryMagnitude = Math.sqrt(queryMagnitudeSq);

  // Score each chunk
  const scoredChunks = chunks.map((chunk, index) => {
    const chunkTokens = tokenize(chunk);
    const chunkFreq: Record<string, number> = {};
    for (const token of chunkTokens) {
      chunkFreq[token] = (chunkFreq[token] || 0) + 1;
    }

    let dotProduct = 0;
    let chunkMagnitudeSq = 0;
    
    // Calculate chunk magnitude
    for (const term in chunkFreq) {
      chunkMagnitudeSq += chunkFreq[term] * chunkFreq[term];
    }
    
    // Dot product
    for (const term in queryFreq) {
      if (chunkFreq[term]) {
        dotProduct += queryFreq[term] * chunkFreq[term];
      }
    }
    
    const chunkMagnitude = Math.sqrt(chunkMagnitudeSq);
    const score = (queryMagnitude > 0 && chunkMagnitude > 0)
      ? dotProduct / (queryMagnitude * chunkMagnitude)
      : 0;

    return { chunk, score, index };
  });

  // Sort by score descending and return the text of the top k chunks
  return scoredChunks
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map(item => item.chunk);
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Conducts a context-aware chat session with the document text using RAG.
 */
export async function chatWithDocument(
  documentText: string,
  documentName: string,
  userMessage: string,
  chatHistory: ChatMessage[],
  modelConfig: AIModelConfig,
  apiKeys: ApiKeys,
): Promise<string> {
  const model = createLanguageModel(modelConfig, apiKeys);
  
  // 1. Determine and retrieve context
  let contextText = '';
  // If the document is small (<35k chars, ~5k-7k tokens), feed it entirely
  if (documentText.length < 35000) {
    contextText = documentText;
  } else {
    // For larger documents, chunk and retrieve top 4 relevant chunks
    const chunks = chunkText(documentText, 800, 200);
    const relevantChunks = retrieveRelevantChunks(userMessage, chunks, 4);
    contextText = relevantChunks.join('\n\n---\n\n');
  }

  // 2. Build instructions & system prompt
  const systemPrompt = `You are DocAI, an expert conversational assistant.
You are helping the user audit, search, and understand the document named "${documentName}".

Below is the retrieved context from the document. Base all your responses strictly on this context:
=========================================
${contextText || 'No document text is available.'}
=========================================

Instructions:
1. Answer the user's questions truthfully and accurately using the context provided above.
2. Reference specific sections, clauses, or phrasing from the context in your answer when available.
3. If the user asks questions unrelated to the document or its content, politely decline to answer. Explain that your purpose is solely to help analyze the uploaded document.
4. If the answer cannot be found in the document context, state: "I cannot find information about that in the uploaded document." Do not speculate or make up information.
5. Maintain a professional, concise, and helpful tone.`;

  // 3. Map conversation logs into Vercel AI SDK CoreMessages format
  const messages = [
    ...chatHistory.map((msg) => ({
      role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.content,
    })),
    { role: 'user' as const, content: userMessage }
  ];

  try {
    const { text } = await generateText({
      model,
      system: systemPrompt,
      messages,
      temperature: 0.2, // grounded responses
    });

    return text;
  } catch (error) {
    console.error('[RAG Engine] Error generating chat response:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while communicating with the AI model.');
  }
}
