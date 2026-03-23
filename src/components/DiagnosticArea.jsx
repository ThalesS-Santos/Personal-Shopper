import React, { useState } from 'react';
import { Terminal, Copy, AlertCircle, RefreshCw, ServerOff, AlertTriangle } from 'lucide-react';
import { useChatContext } from '../contexts/ChatContext';

export default function DiagnosticArea() {
  const { errorState, sessionErrorLog, retryLastMessage, clearErrorState } = useChatContext();
  const [copied, setCopied] = useState(false);

  if (!errorState) return null;

  const handleCopyDump = () => {
    const dump = {
      timestamp: new Date().toISOString(),
      current_error: errorState.details || errorState.message,
      session_log: sessionErrorLog.map(err => err.details || err.message)
    };
    navigator.clipboard.writeText(JSON.stringify(dump, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getBorderColor = (code) => {
    if (code === 'RATE_LIMIT') return 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]';
    if (code === 'INFRA_CONNECTION_ERROR') return 'border-red-600/50 shadow-[0_0_15px_rgba(220,38,38,0.3)]';
    return 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]';
  };

  const currentDetails = errorState.details || {};
  const borderColor = getBorderColor(currentDetails.error_code);

  return (
    <div className={`w-full max-w-4xl mx-auto p-6 bg-gray-900/90 backdrop-blur-xl rounded-xl border ${borderColor} text-green-400 font-mono shadow-2xl relative overflow-hidden animate-fade-in`}>
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-400/30 to-transparent"></div>
      
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <Terminal className="w-6 h-6 text-green-400" />
          <h2 className="text-xl font-bold tracking-widest text-white">SYSTEM_DIAGNOSTICS</h2>
        </div>
        <button 
          onClick={handleCopyDump}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-sm rounded border border-gray-600 transition-colors"
        >
          <Copy className="w-4 h-4" />
          {copied ? 'COPIED!' : 'COPY DEBUG TRACE'}
        </button>
      </div>

      <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
        {sessionErrorLog.map((err, idx) => {
          const isLatest = idx === sessionErrorLog.length - 1;
          const details = err.details || { error_code: 'UNKNOWN', provider: 'System', human_message: err.message };
          
          return (
            <div key={idx} className={`p-4 rounded border flex flex-col gap-2 transition-all ${isLatest ? 'bg-black/40 border-gray-500 scale-100' : 'bg-black/20 border-gray-800 opacity-60 scale-[0.98]'}`}>
              <div className="flex justify-between items-start text-xs text-gray-400 mb-1">
                <span>[{new Date(err.timestamp || Date.now()).toLocaleTimeString()}]</span>
                <span className="bg-gray-800 px-2 py-0.5 rounded text-[10px]">TRACE: {details.trace_id || 'N/A'}</span>
              </div>
              
              <div className="grid grid-cols-12 gap-y-2 text-sm items-start">
                <div className="col-span-12 sm:col-span-3 text-cyan-400 font-bold">[ORIGEM]</div>
                <div className="col-span-12 sm:col-span-9 text-gray-300 break-words">{details.provider}</div>
                
                <div className="col-span-12 sm:col-span-3 text-amber-400 font-bold">[STATUS]</div>
                <div className="col-span-12 sm:col-span-9 text-gray-300 break-words">{details.http_status || details.error_code}</div>
                
                <div className="col-span-12 sm:col-span-3 text-red-400 font-bold">[DETALHE]</div>
                <div className="col-span-12 sm:col-span-9 text-white break-words">{details.human_message || details.message}</div>
                
                {details.suggested_action && (
                  <>
                    <div className="col-span-12 sm:col-span-3 text-green-400 font-bold mt-2">[AÇÃO]</div>
                    <div className="col-span-12 sm:col-span-9 text-green-300 mt-2 font-bold break-words">{details.suggested_action}</div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-end gap-4 mt-6 pt-4 border-t border-gray-700">
        <button 
          onClick={clearErrorState}
          className="px-4 py-2 w-full sm:w-auto text-gray-400 hover:text-white transition-colors text-sm font-bold tracking-widest"
        >
          [ FECHAR E IGNORAR ]
        </button>
        <button 
          onClick={retryLastMessage}
          className="px-8 py-3 w-full sm:w-auto bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/50 rounded flex items-center justify-center gap-2 transition-all font-bold tracking-wider hover:shadow-[0_0_15px_rgba(34,197,94,0.4)]"
        >
          <RefreshCw className="w-5 h-5" />
          [ RETRY ]
        </button>
      </div>
    </div>
  );
}
