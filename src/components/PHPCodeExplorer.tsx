import { useState } from 'react';
import { PHP_CODEBASE, CodeFile } from '../data/phpCodebase';
import { File, Folder, Copy, Check, Download, Search, Info, Terminal, Settings, Database, Code } from 'lucide-react';

export default function PHPCodeExplorer() {
  const [selectedFile, setSelectedFile] = useState<CodeFile>(PHP_CODEBASE[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);

  // Group files by category
  const categories = Array.from(new Set(PHP_CODEBASE.map(f => f.category)));

  // Filter files based on search
  const filteredFiles = PHP_CODEBASE.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = (file: CodeFile) => {
    const element = document.createElement("a");
    const fileBlob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(fileBlob);
    element.download = file.name;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadAll = () => {
    // We can bundle files into a single batch export or SQL+Install package
    const separator = "\n" + "=".repeat(80) + "\n";
    const entireContent = PHP_CODEBASE.map(f => {
      return `FILE PATH: ${f.path}\nCATEGORY: ${f.category}\nLANGUAGE: ${f.language}\n${"=".repeat(40)}\n${f.content}\n`;
    }).join(separator);

    const element = document.createElement("a");
    const fileBlob = new Blob([entireContent], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(fileBlob);
    element.download = "cambodia_smm_panel_complete_mvc.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Icon picking by category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'System Configuration': return <Settings className="w-4 h-4 text-emerald-500" />;
      case 'SQL Database': return <Database className="w-4 h-4 text-amber-500" />;
      case 'Core MVC Engine': return <Terminal className="w-4 h-4 text-sky-500" />;
      case 'Views (HTML/UI)': return <Code className="w-4 h-4 text-pink-500" />;
      default: return <Folder className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <div id="php-exporter-container" className="bg-[#020617] rounded-2xl border border-slate-800 overflow-hidden flex flex-col lg:flex-row h-[750px]">
      
      {/* Sidebar: File Catalog */}
      <div className="w-full lg:w-80 border-r border-slate-800 flex flex-col bg-[#0a0f1d]">
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Folder className="w-5 h-5 text-indigo-400" />
              SMM Codebase
            </h3>
            <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded">
              PHP 8.2 + MVC
            </span>
          </div>

          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search source files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-800 bg-slate-950 px-3 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          </div>
        </div>

        {/* Categories & File lists */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {categories.map(category => {
            const catFiles = filteredFiles.filter(f => f.category === category);
            if (catFiles.length === 0) return null;

            return (
              <div key={category} className="space-y-1.5">
                <div className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase flex items-center gap-1.5 p-1">
                  {getCategoryIcon(category)}
                  {category}
                </div>
                <div className="space-y-0.5">
                  {catFiles.map(file => (
                    <button
                      key={file.path}
                      onClick={() => setSelectedFile(file)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2 transition-colors border-none cursor-pointer ${
                        selectedFile.path === file.path
                          ? 'bg-indigo-500/10 text-indigo-400 font-medium'
                          : 'text-slate-400 hover:bg-slate-900/50'
                      }`}
                    >
                      <File className={`w-3.5 h-3.5 ${
                        selectedFile.path === file.path ? 'text-indigo-400' : 'text-slate-500'
                      }`} />
                      <span className="truncate">{file.path}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          
          {filteredFiles.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-xs">
              No matching files found.
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <button
            onClick={handleDownloadAll}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 hover:text-white text-white rounded-xl text-xs font-semibold cursor-pointer border-none transition-colors shadow-[0_4px_12px_rgba(79,70,229,0.15)]"
          >
            <Download className="w-3.5 h-3.5" />
            Download Complete Package
          </button>
          <p className="text-[10px] text-slate-500 text-center mt-2 font-mono">
            Includes SQL, .env, controllers & scripts
          </p>
        </div>
      </div>

      {/* Main Terminal Code Viewer */}
      <div className="flex-1 flex flex-col bg-zinc-950 text-zinc-300 overflow-hidden relative">
        {/* Code Header bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-zinc-900/60 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <span className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500/80 d-block" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80 d-block" />
              <span className="w-3 h-3 rounded-full bg-green-500/80 d-block" />
            </span>
            <div className="h-4 w-[1px] bg-zinc-800" />
            <span className="font-mono text-xs text-zinc-200 flex items-center gap-1.5">
              <File className="w-4 h-4 text-indigo-400" />
              {selectedFile.path}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Copy Entire File"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={() => handleDownloadFile(selectedFile)}
              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Download File"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Code View blocks */}
        <div className="flex-1 overflow-auto p-6 font-mono text-xs leading-relaxed max-h-[600px] bg-zinc-950">
          <pre className="text-[11px] select-all whitespace-pre-wrap">
            <code>
              {selectedFile.content.split('\n').map((line, idx) => {
                // Inline syntax rendering support
                let styledLine = line;
                
                // Colorize PHP scripts selectively for visualization
                if (selectedFile.language === 'php') {
                  if (line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*')) {
                    return <span key={idx} className="block text-zinc-500 italic">{line}</span>;
                  }
                } else if (selectedFile.language === 'sql') {
                  if (line.trim().startsWith('--')) {
                    return <span key={idx} className="block text-zinc-500 italic">{line}</span>;
                  }
                } else if (selectedFile.language === 'env') {
                  if (line.trim().startsWith('#')) {
                    return <span key={idx} className="block text-emerald-600/70 italic">{line}</span>;
                  }
                }

                return (
                  <span key={idx} className="block">
                    <span className="inline-block w-8 text-zinc-600 select-none text-right pr-3.5 text-[9px]">{idx + 1}</span>
                    <span className="text-zinc-300">{styledLine}</span>
                  </span>
                );
              })}
            </code>
          </pre>
        </div>

        {/* API Notes summary bar */}
        <div className="bg-zinc-900 border-t border-zinc-800 px-6 py-3.5 flex items-center justify-between text-xs font-sans text-zinc-400">
          <span className="flex items-center gap-2 text-indigo-400 font-medium">
            <Info className="w-4 h-4" />
            {selectedFile.category} Module
          </span>
          <span className="text-[10px] bg-zinc-800 px-2 py-1 rounded font-mono uppercase">
            {selectedFile.language} format
          </span>
        </div>
      </div>
    </div>
  );
}
