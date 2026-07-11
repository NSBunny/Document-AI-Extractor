'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  FileUp,
  Sparkles,
  AlertTriangle,
  FileText,
  Brain,
  Settings2,
  Hash,
  Calendar,
  DollarSign,
  Mail,
  Phone,
  MapPin,
  Building2,
  Tag,
  Table2,
  Copy,
  Download,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  Layers,
  Zap,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import StatCard from '@/components/ui/StatCard';
import SectionTitle from '@/components/ui/SectionTitle';
import { useDocAIStore } from '@/store';
import { toast } from 'sonner';
import { exportAsJSON, exportAsCSV, exportAsPDF } from '@/lib/export';
import type { ExtractionResult, FieldCategory, ExtractedField } from '@/lib/types';

/* ─── category helpers ─────────────────────────────────────────────── */

const CATEGORY_META: Record<FieldCategory, { icon: React.ReactNode; color: string }> = {
  date:         { icon: <Calendar size={12} />,  color: 'primary' },
  amount:       { icon: <DollarSign size={12} />, color: 'success' },
  email:        { icon: <Mail size={12} />,       color: 'secondary' },
  phone:        { icon: <Phone size={12} />,      color: 'warning' },
  address:      { icon: <MapPin size={12} />,     color: 'danger' },
  organization: { icon: <Building2 size={12} />,  color: 'primary' },
  identifier:   { icon: <Hash size={12} />,       color: 'warning' },
  name:         { icon: <Tag size={12} />,        color: 'success' },
  clause:       { icon: <FileText size={12} />,   color: 'secondary' },
  general:      { icon: <Tag size={12} />,        color: 'primary' },
};

function groupByCategory(fields: ExtractedField[]): Record<string, ExtractedField[]> {
  const groups: Record<string, ExtractedField[]> = {};
  for (const f of fields) {
    const cat = f.category || 'general';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(f);
  }
  return groups;
}

/* ─── main page ────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    status, setStatus,
    errorMessage, setErrorMessage,
    currentFile, setCurrentFile,
    extractionResult, setExtractionResult,
    history, loadHistoryFromStorage,
    addHistoryEntry, restoreFromHistory,
    resetCurrent,
  } = useDocAIStore();

  const [dragging, setDragging] = useState(false);
  const [showFullText, setShowFullText] = useState(false);

  // Chatbot states
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: 'Hello! I am your DocAI assistant. Ask me anything about this document.' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    loadHistoryFromStorage();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset chat history when document changes
  useEffect(() => {
    if (extractionResult) {
      setChatHistory([
        { role: 'assistant', content: `Hello! I am your DocAI assistant. Ask me anything about "${extractionResult.metadata.fileName}".` }
      ]);
    }
  }, [extractionResult]);

  /* ─── upload logic ──────────────────────────────────────────────── */

  const processFile = useCallback(async (file: File) => {
    setCurrentFile({ name: file.name, size: file.size, type: file.type });
    setStatus('uploading');
    setErrorMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      setStatus('extracting');
      const res = await fetch('/api/upload', { method: 'POST', body: formData });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(body.error || `Server error ${res.status}`);
      }

      const result: ExtractionResult = await res.json();
      setExtractionResult(result);
      setStatus('done');
      toast.success(`Extracted ${result.fields.length} fields from ${file.name}`);

      addHistoryEntry({
        id: crypto.randomUUID(),
        fileName: file.name,
        documentType: result.documentType,
        fieldCount: result.fields.length,
        confidence: result.confidence,
        processedAt: result.processedAt,
        result,
      });
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err?.message || 'An unknown error occurred');
      toast.error(err?.message || 'Extraction failed');
    }
  }, [setCurrentFile, setStatus, setErrorMessage, setExtractionResult, addHistoryEntry]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) processFile(e.target.files[0]);
  };

  const handleCopy = async () => {
    if (!extractionResult) return;
    await navigator.clipboard.writeText(JSON.stringify(extractionResult, null, 2));
    toast.success('Copied to clipboard');
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || chatLoading || !extractionResult) return;

    const query = chatMessage.trim();
    setChatMessage('');
    const newHistory = [...chatHistory, { role: 'user' as const, content: query }];
    setChatHistory(newHistory);
    setChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText: extractionResult.rawText,
          documentName: extractionResult.metadata.fileName,
          message: query,
          history: newHistory.slice(0, -1),
          modelConfig: {
            provider: 'openai',
            modelId: 'gpt-4o-mini',
            displayName: 'GPT-4o Mini'
          },
          apiKeys: {} // Key is managed securely on server-side (.env.local)
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Failed to generate response' }));
        throw new Error(data.error || `Server error ${res.status}`);
      }

      const data = await res.json();
      setChatHistory([...newHistory, { role: 'assistant' as const, content: data.message }]);
    } catch (err: any) {
      toast.error(err?.message || 'Chat response failed');
      setChatHistory([...newHistory, { role: 'assistant' as const, content: `Error: ${err?.message || 'Failed to generate response.'}` }]);
    } finally {
      setChatLoading(false);
    }
  };



  /* ─── IDLE state ────────────────────────────────────────────────── */

  if (status === 'idle') {
    return (
      <div className="flex flex-col gap-8">
        {/* Hero */}
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full mb-5">
            <Sparkles size={14} className="text-primary" />
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider">AI-Powered • Free • No API Keys</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
            <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">DocAI</span>
          </h1>
          <p className="text-base text-text-secondary mt-3 max-w-lg mx-auto leading-relaxed">
            Upload any document. Get structured data instantly.
          </p>
        </div>

        {/* Upload Zone */}
        <Card
          hoverable={false}
          onDragOver={(e: React.DragEvent) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center text-center p-12 border-dashed border-2 min-h-[320px] transition-all duration-300 cursor-pointer ${
            dragging
              ? 'border-primary bg-primary/5 shadow-[0_0_40px_rgba(109,94,249,0.15)]'
              : 'border-border hover:border-primary/40'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 transition-all duration-300 ${
            dragging
              ? 'bg-primary/20 border-primary/40 shadow-[0_0_30px_rgba(109,94,249,0.3)]'
              : 'bg-primary/10 border border-primary/20'
          }`}>
            <FileUp size={36} className="text-primary" />
          </div>
          <h2 className="text-lg font-bold text-text-primary mb-2">
            Drop your document here
          </h2>
          <p className="text-sm text-text-secondary max-w-sm mb-6 leading-relaxed">
            Drag and drop or click to browse. We&apos;ll extract text, detect fields, classify the document — all automatically.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.tiff,.tif,.webp"
            onChange={handleFileChange}
          />
          <Button variant="primary" onClick={(e: React.MouseEvent) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
            <FileUp size={16} />
            <span>Browse Files</span>
          </Button>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6 text-[10px] text-text-tertiary font-medium">
            <span>PDF</span><span>•</span><span>DOCX</span><span>•</span><span>TXT</span><span>•</span>
            <span>PNG</span><span>•</span><span>JPG</span><span>•</span><span>TIFF</span><span>•</span>
            <span>WebP</span>
          </div>
        </Card>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: <Brain size={24} />, title: 'AI Text Extraction', desc: 'OCR for images, native parsing for PDFs & Word docs. Tesseract.js powers free, local OCR.' },
            { icon: <Zap size={24} />, title: 'Smart Classification', desc: 'Auto-detects document type — invoice, contract, receipt, resume — with confidence scoring.' },
            { icon: <Settings2 size={24} />, title: 'Zero Config', desc: 'No API keys. No signup. No backend cost. Everything runs on free, open-source tools.' },
          ].map((f, i) => (
            <Card key={i} hoverable={true} className="flex flex-col items-center text-center p-6 min-h-[180px]">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4">
                {f.icon}
              </div>
              <h3 className="text-sm font-bold text-text-primary mb-1.5">{f.title}</h3>
              <p className="text-xs text-text-secondary leading-relaxed">{f.desc}</p>
            </Card>
          ))}
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="flex flex-col gap-4" id="history-section">
            <SectionTitle title="Recent Extractions" subtitle="Click to restore a previous result" icon={<Clock size={16} />} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.slice(0, 6).map((entry) => (
                <Card
                  key={entry.id}
                  onClick={() => { restoreFromHistory(entry.id); toast.info(`Restored: ${entry.fileName}`); }}
                  className="flex flex-col gap-2 p-4"
                >
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-primary flex-shrink-0" />
                    <span className="text-xs font-bold text-text-primary truncate">{entry.fileName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="primary">{entry.documentType}</Badge>
                    <span className="text-[10px] text-text-tertiary">{entry.fieldCount} fields</span>
                    <span className="text-[10px] text-text-tertiary ml-auto">{Math.round(entry.confidence * 100)}%</span>
                  </div>
                  <span className="text-[10px] text-text-muted">{new Date(entry.processedAt).toLocaleString()}</span>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ─── UPLOADING / EXTRACTING state ─────────────────────────────── */

  if (status === 'uploading' || status === 'extracting') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Card hoverable={false} className="flex flex-col items-center justify-center text-center p-12 max-w-md w-full">
          <div className="relative mb-8">
            <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_25px_rgba(109,94,249,0.3)]" />
            <div className="absolute inset-0 w-20 h-20 border-4 border-secondary/20 rounded-full animate-pulse" />
          </div>
          <h2 className="text-lg font-bold text-text-primary mb-2">
            {status === 'uploading' ? 'Uploading document…' : 'Analyzing document structure…'}
          </h2>
          <p className="text-sm text-text-secondary mb-4 max-w-xs leading-relaxed">
            {status === 'uploading'
              ? 'Sending your file to the extraction engine.'
              : 'Extracting text, detecting fields, classifying document type.'}
          </p>
          {currentFile && (
            <div className="flex items-center gap-2 bg-surface-elevated/50 border border-border px-3 py-1.5 rounded-lg">
              <FileText size={12} className="text-primary" />
              <span className="text-xs text-text-secondary font-medium truncate max-w-[200px]">{currentFile.name}</span>
            </div>
          )}
          <div className="flex gap-1 mt-6">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-primary animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  /* ─── ERROR state ──────────────────────────────────────────────── */

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Card hoverable={false} className="flex flex-col items-center justify-center text-center p-12 max-w-md w-full border-danger/20">
          <div className="w-16 h-16 bg-danger/10 border border-danger/20 text-danger rounded-2xl flex items-center justify-center mb-6">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-lg font-bold text-text-primary mb-2">Extraction Failed</h2>
          <p className="text-sm text-text-secondary mb-6 max-w-xs leading-relaxed">
            {errorMessage || 'Something went wrong during document processing.'}
          </p>
          <Button variant="primary" onClick={resetCurrent}>
            <RotateCcw size={16} />
            <span>Try Again</span>
          </Button>
        </Card>
      </div>
    );
  }

  /* ─── DONE state — results ─────────────────────────────────────── */

  const result = extractionResult;
  if (!result) return null;

  const grouped = groupByCategory(result.fields);

  return (
    <div className="flex flex-col gap-6">
      {/* Success header */}
      <div className="glass-panel p-6 rounded-3xl noise-bg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-success/10 border border-success/20 rounded-xl flex items-center justify-center">
              <CheckCircle2 size={20} className="text-success" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-text-primary leading-tight">Extraction Complete</h1>
              <p className="text-xs text-text-secondary">{result.metadata.fileName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="primary">{result.documentType.toUpperCase()}</Badge>
            <Badge variant="success">{Math.round(result.confidence * 100)}% confidence</Badge>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => exportAsJSON(result)}>
            <Download size={14} />
            <span>JSON</span>
          </Button>
          <Button variant="outline" onClick={() => exportAsCSV(result)}>
            <Download size={14} />
            <span>CSV</span>
          </Button>
          <Button variant="outline" onClick={() => exportAsPDF(result)}>
            <Download size={14} />
            <span>PDF</span>
          </Button>
          <Button variant="outline" onClick={handleCopy}>
            <Copy size={14} />
            <span>Copy</span>
          </Button>
          <Button variant="primary" onClick={resetCurrent}>
            <RotateCcw size={14} />
            <span>New</span>
          </Button>
        </div>
      </div>

      {/* Main Grid: Left = Extraction Results, Right = Interactive Chatbot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Extraction Results */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard title="Words" value={result.metadata.wordCount.toLocaleString()} icon={<FileText size={18} />} color="primary" />
            <StatCard title="Fields Extracted" value={String(result.fields.length)} icon={<Layers size={18} />} color="success" />
            <StatCard title="Tables Found" value={String(result.tables.length)} icon={<Table2 size={18} />} color="warning" />
            <StatCard title="Pages" value={String(result.metadata.pageCount ?? '—')} icon={<FileText size={18} />} color="primary" />
          </div>

          {/* Summary */}
          {result.summary && (
            <Card hoverable={false} className="flex flex-col gap-2">
              <SectionTitle title="Document Summary" subtitle="Key information extracted from the document" icon={<Sparkles size={16} />} />
              <p className="text-sm text-text-secondary leading-relaxed mt-2">{result.summary}</p>
            </Card>
          )}

          {/* Extracted fields by category */}
          {Object.keys(grouped).length > 0 && (
            <div className="flex flex-col gap-4">
              <SectionTitle title="Extracted Fields" subtitle={`${result.fields.length} fields detected across ${Object.keys(grouped).length} categories`} icon={<Layers size={16} />} />
              {Object.entries(grouped).map(([category, fields]) => {
                const meta = CATEGORY_META[category as FieldCategory] || CATEGORY_META.general;
                return (
                  <div key={category} className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-text-tertiary">{meta.icon}</span>
                      <span className="text-xs font-bold text-text-primary uppercase tracking-wider">{category}</span>
                      <span className="text-[10px] text-text-muted">({fields.length})</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {fields.map((field, idx) => (
                        <div
                          key={`${category}-${idx}`}
                          className="glass-panel rounded-xl p-4 flex flex-col gap-2 hover:border-primary/30 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">{field.label}</span>
                            <Badge variant={meta.color as any}>{Math.round(field.confidence * 100)}%</Badge>
                          </div>
                          <span className="text-sm font-semibold text-text-primary break-words">{field.value}</span>
                          {/* confidence bar */}
                          <div className="w-full bg-border/40 h-1 rounded-full overflow-hidden mt-1">
                            <div
                              className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-primary to-secondary"
                              style={{ width: `${Math.round(field.confidence * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tables */}
          {result.tables.length > 0 && (
            <div className="flex flex-col gap-4">
              <SectionTitle title="Detected Tables" subtitle={`${result.tables.length} table(s) found in the document`} icon={<Table2 size={16} />} />
              {result.tables.map((table, tIdx) => (
                <Card key={tIdx} hoverable={false} className="overflow-x-auto">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        {table.headers.map((h, i) => (
                          <th key={i} className="p-3 text-left text-text-tertiary font-bold uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-border/30 hover:bg-surface-hover/30 transition-colors">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="p-3 text-text-secondary">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              ))}
            </div>
          )}

          {/* Raw text */}
          <Card hoverable={false} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <SectionTitle title="Raw Text" subtitle={`${result.metadata.characterCount.toLocaleString()} characters`} icon={<FileText size={16} />} />
              <button
                onClick={() => setShowFullText(!showFullText)}
                className="flex items-center gap-1 text-xs text-primary font-semibold hover:text-primary/80 transition-colors cursor-pointer"
              >
                <span>{showFullText ? 'Show less' : 'Show more'}</span>
                {showFullText ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
            <pre className="text-xs text-text-secondary font-mono leading-relaxed whitespace-pre-wrap bg-surface/50 border border-border/50 rounded-xl p-4 max-h-[400px] overflow-y-auto">
              {showFullText ? result.rawText : result.rawText.slice(0, 500) + (result.rawText.length > 500 ? '…' : '')}
            </pre>
          </Card>
        </div>

        {/* Right Column: Chatbot */}
        <div className="lg:col-span-1 flex flex-col gap-4 sticky top-20 no-print">
          <Card hoverable={false} className="flex flex-col h-[calc(100vh-14rem)] min-h-[500px] justify-between">
            <div>
              <SectionTitle
                title="Chat with Document"
                subtitle="Powered by GPT-4o Mini"
                icon={<Brain size={16} className="text-primary" />}
              />
              
              {/* Messages list */}
              <div className="overflow-y-auto flex flex-col gap-3 my-4 pr-1 border-t border-border/30 py-3 max-h-[calc(100vh-24rem)] min-h-[300px] scrollbar-thin">
                {chatHistory.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col gap-1 p-3 rounded-xl max-w-[85%] text-xs leading-normal ${
                      msg.role === 'user'
                        ? 'bg-primary/10 border border-primary/20 self-end text-right'
                        : 'bg-surface-elevated border border-border self-start'
                    }`}
                  >
                    <span className="font-bold text-[9px] uppercase tracking-wider text-text-tertiary">
                      {msg.role === 'user' ? 'You' : 'Assistant'}
                    </span>
                    <span className="text-text-primary whitespace-pre-wrap">{msg.content}</span>
                  </div>
                ))}
                {chatLoading && (
                  <div className="bg-surface-elevated border border-border self-start p-3 rounded-xl max-w-[85%] text-xs flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                )}
              </div>
            </div>

            {/* Chat input form */}
            <form onSubmit={handleSendChatMessage} className="flex gap-2 pt-2 border-t border-border/30">
              <input
                type="text"
                placeholder="Ask a question..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                disabled={chatLoading}
                className="flex-1 bg-surface-elevated border border-border rounded-xl px-3.5 py-2 text-xs text-text-primary focus:outline-none focus:border-primary disabled:opacity-50"
              />
              <Button variant="primary" type="submit" disabled={chatLoading || !chatMessage.trim()}>
                Send
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
