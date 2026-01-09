
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { processAudioWithGemini } from './services/geminiService';
import { BatchFile, AIAction, ProcessingStatus } from './types';
import { 
  FileAudio, 
  Upload, 
  Settings, 
  FileText, 
  Layout, 
  Clipboard, 
  Check, 
  RefreshCcw,
  Sparkles,
  Zap,
  Mic,
  PlusCircle,
  Trash2,
  Play,
  Layers,
  FileCheck
} from 'lucide-react';

const App: React.FC = () => {
  const [files, setFiles] = useState<BatchFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedFile = files.find(f => f.id === selectedFileId);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList) return;

    const newFiles = Array.from(fileList);
    if (newFiles.length === 0) return;

    newFiles.forEach((file: File) => {
      const reader = new FileReader();
      const id = Math.random().toString(36).substr(2, 9);
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        const batchFile: BatchFile = {
          id,
          file,
          previewUrl: URL.createObjectURL(file),
          base64: base64String,
          mimeType: file.type || 'audio/mpeg',
          status: 'idle',
          results: {}
        };
        setFiles(prev => [...prev, batchFile]);
        if (!selectedFileId) setSelectedFileId(id);
      };
      reader.readAsDataURL(file);
    });
    
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFiles(prev => prev.filter(f => f.id !== id));
    if (selectedFileId === id) {
      const remaining = files.filter(f => f.id !== id);
      setSelectedFileId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const runActionForFile = async (fileId: string, action: AIAction) => {
    const targetFile = files.find(f => f.id === fileId);
    if (!targetFile) return;

    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'processing' } : f));

    try {
      const existingText = targetFile.results['TRANSCRIBE'] || "";
      const resultText = await processAudioWithGemini(
        targetFile.base64, 
        targetFile.mimeType, 
        action, 
        existingText
      );

      setFiles(prev => prev.map(f => {
        if (f.id === fileId) {
          return {
            ...f,
            status: 'completed',
            results: { ...f.results, [action]: resultText }
          };
        }
        return f;
      }));
    } catch (error) {
      console.error("Error:", error);
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'error' } : f));
    }
  };

  const processAll = async () => {
    if (isBatchProcessing) return;
    setIsBatchProcessing(true);
    
    const idleFiles = files.filter(f => f.status === 'idle' || f.status === 'error');
    for (const file of idleFiles) {
      await runActionForFile(file.id, 'TRANSCRIBE');
    }
    
    setIsBatchProcessing(false);
  };

  const copyToClipboard = () => {
    // Ưu tiên copy kết quả đang hiển thị hoặc kết quả mới nhất
    const results = selectedFile?.results;
    if (!results) return;
    
    const text = results['REPORT'] || results['FORMAT'] || results['TRANSCRIBE'] || results['SUMMARY'] || results['SUPPLEMENT'];
    
    if (text) {
      navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center p-4 md:p-8 selection:bg-indigo-100">
      <header className="w-full max-w-6xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-100">
              <Layers className="text-white w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              BatchAudio <span className="text-indigo-600">Pro</span>
            </h1>
          </div>
          <p className="text-slate-500 text-sm">Xử lý hàng loạt âm thanh với AI Gemini 3 (Hỗ trợ Markdown)</p>
        </div>
        
        <div className="flex gap-2">
           <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <PlusCircle className="w-4 h-4 text-indigo-600" />
            Thêm file
          </button>
          <button 
            onClick={processAll}
            disabled={files.length === 0 || isBatchProcessing}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:shadow-none active:scale-95"
          >
            {isBatchProcessing ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Xử lý tất cả ({files.filter(f => f.status !== 'completed').length})
          </button>
        </div>
      </header>

      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 flex flex-col gap-6 sticky top-8">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col max-h-[70vh]">
            <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                <FileAudio className="w-4 h-4" />
                Hàng chờ ({files.length})
              </h2>
              {files.length > 0 && (
                 <button onClick={() => setFiles([])} className="text-xs text-red-500 hover:underline">Xóa hết</button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {files.length === 0 ? (
                <div className="py-12 px-4 text-center">
                  <Upload className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">Chưa có file nào được tải lên</p>
                </div>
              ) : (
                files.map(f => (
                  <div 
                    key={f.id}
                    onClick={() => setSelectedFileId(f.id)}
                    className={`group relative p-3 rounded-2xl cursor-pointer transition-all border
                      ${selectedFileId === f.id 
                        ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                        : 'bg-white border-transparent hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                        ${f.status === 'completed' ? 'bg-green-100 text-green-600' : 
                          f.status === 'processing' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                        {f.status === 'processing' ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-700 truncate">{f.file.name}</p>
                        <p className="text-[10px] text-slate-400">{(f.file.size / (1024*1024)).toFixed(1)} MB • {f.status}</p>
                      </div>
                      <button 
                        onClick={(e) => removeFile(f.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {selectedFile && (
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-500" />
                Thao tác AI
              </h3>
              <div className="grid grid-cols-1 gap-2">
                <ActionBtn 
                  icon={<Mic className="w-4 h-4" />} 
                  label="Chuyển văn bản" 
                  onClick={() => runActionForFile(selectedFile.id, 'TRANSCRIBE')}
                  loading={selectedFile.status === 'processing'}
                  active={!!selectedFile.results['TRANSCRIBE']}
                />
                <ActionBtn 
                  icon={<Layout className="w-4 h-4" />} 
                  label="Định dạng Markdown" 
                  onClick={() => runActionForFile(selectedFile.id, 'FORMAT')}
                  loading={selectedFile.status === 'processing'}
                  active={!!selectedFile.results['FORMAT']}
                  disabled={!selectedFile.results['TRANSCRIBE']}
                />
                <ActionBtn 
                  icon={<FileText className="w-4 h-4" />} 
                  label="Viết báo cáo chi tiết" 
                  onClick={() => runActionForFile(selectedFile.id, 'REPORT')}
                  loading={selectedFile.status === 'processing'}
                  active={!!selectedFile.results['REPORT']}
                  disabled={!selectedFile.results['TRANSCRIBE']}
                />
                <ActionBtn 
                  icon={<Sparkles className="w-4 h-4" />} 
                  label="Tóm tắt nội dung" 
                  onClick={() => runActionForFile(selectedFile.id, 'SUMMARY')}
                  loading={selectedFile.status === 'processing'}
                  active={!!selectedFile.results['SUMMARY']}
                  disabled={!selectedFile.results['TRANSCRIBE']}
                />
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-8 space-y-4">
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="audio/*"
            multiple
            className="hidden"
          />

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col min-h-[600px] overflow-hidden">
            {selectedFile ? (
              <>
                <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                  <div className="flex items-center gap-4">
                    <div className="bg-white p-2 rounded-lg border border-slate-100">
                       <FileCheck className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-800 leading-none">{selectedFile.file.name}</h2>
                      <span className="text-[10px] text-slate-400 mt-1 block italic">{selectedFile.mimeType}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={copyToClipboard}
                      className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 transition-all active:scale-90"
                      title="Sao chép nội dung"
                    >
                      {copySuccess ? <Check className="w-5 h-5 text-green-500" /> : <Clipboard className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="p-6 bg-slate-50/50 border-b border-slate-100">
                   <audio key={selectedFile.id} controls src={selectedFile.previewUrl} className="w-full h-10" />
                </div>

                <div className="flex-1 p-8 overflow-y-auto">
                  {Object.keys(selectedFile.results).length > 0 ? (
                    <div className="space-y-10">
                      {(Object.entries(selectedFile.results) as [AIAction, string][]).map(([action, text]) => (
                        <div key={action} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                          <div className="flex items-center gap-2 mb-4">
                            <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-lg shadow-sm uppercase tracking-widest">
                              {action}
                            </span>
                            <div className="h-px flex-1 bg-slate-100"></div>
                          </div>
                          <div className="prose prose-slate prose-indigo max-w-none text-slate-700">
                            <ReactMarkdown>{text}</ReactMarkdown>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 py-20">
                      {selectedFile.status === 'processing' ? (
                        <>
                           <RefreshCcw className="w-12 h-12 animate-spin text-indigo-400" />
                           <p className="font-medium animate-pulse text-slate-500">Gemini đang xử lý dữ liệu...</p>
                        </>
                      ) : (
                        <>
                           <Mic className="w-16 h-16 opacity-10" />
                           <p className="font-medium">Vui lòng chọn thao tác AI bên trái để bắt đầu</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50/30">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl shadow-slate-200/50 mb-6 border border-slate-100">
                  <Upload className="w-10 h-10 text-indigo-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Bắt đầu xử lý âm thanh</h3>
                <p className="text-slate-400 max-w-sm mb-8">Tải lên một hoặc nhiều file audio để Gemini giúp bạn chuyển đổi và phân tích dữ liệu chuyên nghiệp.</p>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 active:scale-95"
                >
                  Chọn files để bắt đầu
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="mt-12 text-slate-400 text-xs py-8 border-t border-slate-100 w-full max-w-6xl text-center">
        Batch Processing Dashboard • Powered by Google Gemini 3 • Markdown Supported View
      </footer>
    </div>
  );
};

const ActionBtn = ({ icon, label, onClick, loading, active, disabled = false }: any) => (
  <button 
    onClick={onClick}
    disabled={disabled || loading}
    className={`flex items-center gap-3 w-full p-3.5 rounded-2xl border text-sm font-bold transition-all
      ${active ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200 hover:shadow-sm'}
      ${(disabled || loading) ? 'opacity-40 cursor-not-allowed grayscale' : 'active:scale-[0.98] cursor-pointer group'}`}
  >
    <div className={`shrink-0 p-1.5 rounded-lg transition-colors ${active ? 'bg-white/20 text-white' : 'bg-slate-50 text-indigo-500 group-hover:bg-indigo-50'}`}>
      {loading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : icon}
    </div>
    <span className="truncate">{label}</span>
  </button>
);

export default App;
