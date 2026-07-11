import { NextRequest, NextResponse } from 'next/server';
import { extractDocument } from '@/lib/document-ai';
import { getSupportedFormats } from '@/lib/document-parser';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'No file provided. Please upload a document or image file.' },
        { status: 400 },
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File size exceeds the maximum limit of 100 MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)} MB.`,
        },
        { status: 413 },
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: 'The uploaded file is empty.' },
        { status: 400 },
      );
    }

    // Validate file type by extension
    const supportedFormats = getSupportedFormats();
    const fileExtension = file.name.match(/\.(\w+)$/i)?.[0]?.toLowerCase() ?? '';
    const supportedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/png',
      'image/jpeg',
      'image/tiff',
      'image/webp',
    ];
    const isSupported =
      supportedFormats.includes(fileExtension) ||
      supportedMimeTypes.includes(file.type);

    if (!isSupported) {
      return NextResponse.json(
        {
          error: `Unsupported file type: "${file.name}". Supported formats: ${supportedFormats.join(', ')}`,
        },
        { status: 415 },
      );
    }

    // Convert the File to a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Run the full extraction pipeline
    const result = await extractDocument(buffer, file.name, file.type);

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'An unexpected error occurred while processing the uploaded file.';

    console.error('[/api/upload] Error:', message);

    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
