import { NextRequest, NextResponse } from 'next/server';
import { chatWithDocument, type ChatMessage } from '@/lib/rag-engine';
import type { AIModelConfig } from '@/lib/types';

interface ChatRequestBody {
  documentText: string;
  documentName: string;
  message: string;
  history: ChatMessage[];
  modelConfig: AIModelConfig;
  apiKeys: {
    openai?: string;
    anthropic?: string;
    google?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    let body: ChatRequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body. Expected valid JSON.' },
        { status: 400 },
      );
    }

    const { documentText, documentName, message, history, modelConfig, apiKeys } = body;

    if (!documentText) {
      return NextResponse.json(
        { error: 'Document text is required.' },
        { status: 400 },
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: 'User message is required.' },
        { status: 400 },
      );
    }

    if (!modelConfig || !modelConfig.provider || !modelConfig.modelId) {
      return NextResponse.json(
        { error: 'AI model configuration is required.' },
        { status: 400 },
      );
    }

    // Generate response using RAG
    const aiMessage = await chatWithDocument(
      documentText,
      documentName,
      message,
      history || [],
      modelConfig,
      apiKeys || {},
    );

    return NextResponse.json({ message: aiMessage });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'An unexpected error occurred during chat.';

    console.error('[/api/chat] Error:', message);

    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
