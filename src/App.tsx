import { useState, useRef, useEffect, useCallback } from 'react';
import { TopBar } from './components/TopBar';
import { SidebarLeft } from './components/SidebarLeft';
import { SidebarRight } from './components/SidebarRight';
import { CanvasEditor } from './components/CanvasEditor';
import { TextPlaceholder, TemplateConfig, CsvRow } from './types';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

export default function App() {
  const [config, setConfigState] = useState<TemplateConfig>({
    backgroundImage: null,
    placeholders: [],
    customFonts: [],
  });
  
  const [history, setHistory] = useState<TemplateConfig[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const setConfig = useCallback((newConfig: TemplateConfig | ((prev: TemplateConfig) => TemplateConfig)) => {
    setConfigState((prev) => {
      const nextConfig = typeof newConfig === 'function' ? newConfig(prev) : newConfig;
      
      // Only save to history if it actually changed
      if (JSON.stringify(prev) !== JSON.stringify(nextConfig)) {
        setHistory((prevHistory) => {
          const newHistory = prevHistory.slice(0, historyIndex + 1);
          newHistory.push(nextConfig);
          // Keep last 50 states
          if (newHistory.length > 50) newHistory.shift();
          return newHistory;
        });
        setHistoryIndex((prevIndex) => Math.min(prevIndex + 1, 49));
      }
      
      return nextConfig;
    });
  }, [historyIndex]);

  // Initialize history
  useEffect(() => {
    if (history.length === 0) {
      setHistory([config]);
      setHistoryIndex(0);
    }
  }, []);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setConfigState(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setConfigState(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
        } else if (e.key === 'y') {
          redo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const [csvData, setCsvData] = useState<CsvRow[]>([]);
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewRowIndex, setPreviewRowIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(false);

  // Load custom fonts
  useEffect(() => {
    config.customFonts.forEach((font) => {
      const fontFace = new FontFace(font.name, `url(${font.dataUrl})`);
      fontFace.load().then((loadedFace) => {
        document.fonts.add(loadedFace);
      }).catch((err) => {
        console.error('Failed to load font:', font.name, err);
      });
    });
  }, [config.customFonts]);

  // Listen for template drop
  useEffect(() => {
    const handleTemplateDrop = (e: any) => {
      setConfig((prev) => ({ 
        ...prev, 
        backgroundImage: e.detail.dataUrl,
        backgroundName: e.detail.fileName
      }));
      toast.success(`Template uploaded: ${e.detail.fileName}`);
    };
    window.addEventListener('template-drop', handleTemplateDrop);
    return () => window.removeEventListener('template-drop', handleTemplateDrop);
  }, [setConfig]);

  const updatePlaceholder = (id: string, updates: Partial<TextPlaceholder>) => {
    setConfig((prev) => ({
      ...prev,
      placeholders: prev.placeholders.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  };

  const addPlaceholder = (x: number = 100, y: number = 100) => {
    const newPlaceholder: TextPlaceholder = {
      id: uuidv4(),
      label: `Field ${config.placeholders.length + 1}`,
      columnName: '',
      text: 'Sample Text',
      x,
      y,
      width: 200,
      fontSize: 40,
      fontFamily: 'Inter',
      fontWeight: 'normal',
      fontStyle: 'normal',
      fill: '#000000',
      align: 'center',
      letterSpacing: 0,
      lineHeight: 1.2,
      textTransform: 'none',
      opacity: 1,
      rotation: 0,
    };
    setConfig((prev) => ({
      ...prev,
      placeholders: [...prev.placeholders, newPlaceholder],
    }));
    setSelectedId(newPlaceholder.id);
  };

  const deletePlaceholder = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      placeholders: prev.placeholders.filter((p) => p.id !== id),
    }));
    if (selectedId === id) setSelectedId(null);
  };

  const duplicatePlaceholder = (id: string) => {
    const p = config.placeholders.find((p) => p.id === id);
    if (!p) return;
    const newPlaceholder = { ...p, id: uuidv4(), x: p.x + 20, y: p.y + 20 };
    setConfig((prev) => ({
      ...prev,
      placeholders: [...prev.placeholders, newPlaceholder],
    }));
    setSelectedId(newPlaceholder.id);
  };

  const selectedPlaceholder = config.placeholders.find((p) => p.id === selectedId) || null;

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <TopBar 
        config={config} 
        setConfig={setConfig} 
        csvData={csvData} 
        setCsvData={setCsvData}
        setCsvColumns={setCsvColumns}
        previewRowIndex={previewRowIndex}
        setPreviewRowIndex={setPreviewRowIndex}
        zoom={zoom}
        setZoom={setZoom}
        undo={undo}
        redo={redo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        showGrid={showGrid}
        setShowGrid={setShowGrid}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <SidebarLeft 
          placeholders={config.placeholders} 
          selectedId={selectedId} 
          setSelectedId={setSelectedId}
          addPlaceholder={addPlaceholder}
          deletePlaceholder={deletePlaceholder}
          duplicatePlaceholder={duplicatePlaceholder}
          csvColumns={csvColumns}
          updatePlaceholder={updatePlaceholder}
        />
        
        <main className="flex-1 relative overflow-hidden bg-slate-100 flex items-center justify-center p-8">
          <CanvasEditor 
            config={config}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            updatePlaceholder={updatePlaceholder}
            previewData={previewRowIndex !== null ? csvData[previewRowIndex] : null}
            zoom={zoom}
            addPlaceholder={addPlaceholder}
            showGrid={showGrid}
          />
        </main>
        
        <SidebarRight 
          selectedPlaceholder={selectedPlaceholder}
          updatePlaceholder={updatePlaceholder}
          customFonts={config.customFonts}
          setConfig={setConfig}
        />
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
}
