import { Button } from '@/components/ui/button';
import { Upload, Download, Save, FileJson, FileSpreadsheet, Play, Image as ImageIcon, ZoomIn, ZoomOut, Table as TableIcon, Undo2, Redo2, Grid3X3 } from 'lucide-react';
import { TemplateConfig, CsvRow } from '../types';
import { toast } from 'sonner';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { generateCertificates } from '../lib/generate';
import { Label } from '@/components/ui/label';

interface TopBarProps {
  config: TemplateConfig;
  setConfig: React.Dispatch<React.SetStateAction<TemplateConfig>>;
  csvData: CsvRow[];
  setCsvData: React.Dispatch<React.SetStateAction<CsvRow[]>>;
  setCsvColumns: React.Dispatch<React.SetStateAction<string[]>>;
  previewRowIndex: number | null;
  setPreviewRowIndex: React.Dispatch<React.SetStateAction<number | null>>;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  showGrid: boolean;
  setShowGrid: React.Dispatch<React.SetStateAction<boolean>>;
}

export function TopBar({ config, setConfig, csvData, setCsvData, setCsvColumns, previewRowIndex, setPreviewRowIndex, zoom, setZoom, undo, redo, canUndo, canRedo, showGrid, setShowGrid }: TopBarProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showDataDialog, setShowDataDialog] = useState(false);
  const [format, setFormat] = useState<'pdf' | 'pdf-single' | 'png'>('pdf');
  const [fileNameColumn, setFileNameColumn] = useState<string>('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setConfig((prev) => ({ 
        ...prev, 
        backgroundImage: event.target?.result as string,
        backgroundName: file.name
      }));
      toast.success(`Template uploaded: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setCsvData(results.data as CsvRow[]);
          setCsvColumns(results.meta.fields || []);
          toast.success(`Loaded ${results.data.length} rows from CSV`);
        },
        error: (error) => {
          toast.error(`Error parsing CSV: ${error.message}`);
        }
      });
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet) as CsvRow[];
        if (json.length > 0) {
          setCsvData(json);
          setCsvColumns(Object.keys(json[0]));
          toast.success(`Loaded ${json.length} rows from Excel`);
        } else {
          toast.error('Excel file is empty');
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleSaveTemplate = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "certificate_template.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    toast.success('Template saved');
  };

  const handleLoadTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const loadedConfig = JSON.parse(event.target?.result as string);
        setConfig(loadedConfig);
        toast.success('Template loaded successfully');
      } catch (err) {
        toast.error('Invalid template file');
      }
    };
    reader.readAsText(file);
  };

  const togglePreview = () => {
    if (csvData.length === 0) {
      toast.error('Please upload CSV/Excel data first');
      return;
    }
    if (previewRowIndex === null) {
      setPreviewRowIndex(0);
    } else {
      setPreviewRowIndex(null);
    }
  };

  const startGeneration = async () => {
    setShowGenerateDialog(false);
    setIsGenerating(true);
    setProgress(0);
    try {
      await generateCertificates(config, csvData, format, setProgress, fileNameColumn);
    } catch (error: any) {
      toast.error(`Generation failed: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateClick = () => {
    if (!config.backgroundImage) {
      toast.error('Please upload a template image first');
      return;
    }
    if (csvData.length === 0) {
      toast.error('Please upload CSV/Excel data first');
      return;
    }
    setShowGenerateDialog(true);
  };

  const csvColumns = csvData.length > 0 ? Object.keys(csvData[0]) : [];

  return (
    <>
      <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <h1 className="font-semibold text-lg tracking-tight">CertiGen</h1>
          <div className="h-6 w-px bg-slate-200 mx-2" />
          
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo} className="h-8 w-8" title="Undo (Ctrl+Z)">
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo} className="h-8 w-8" title="Redo (Ctrl+Y)">
              <Redo2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="h-6 w-px bg-slate-200 mx-2" />

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => document.getElementById('template-upload')?.click()}>
              <ImageIcon className="w-4 h-4" />
              Upload Template
            </Button>
            <input id="template-upload" type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleImageUpload} />
            
            {config.backgroundName && (
              <span className="text-xs text-slate-500 max-w-[150px] truncate" title={config.backgroundName}>
                {config.backgroundName}
              </span>
            )}

            <Button variant="outline" size="sm" className="gap-2" onClick={() => document.getElementById('csv-upload')?.click()}>
              <FileSpreadsheet className="w-4 h-4" />
              Upload Data
            </Button>
            <input id="csv-upload" type="file" accept=".csv, .xlsx, .xls" className="hidden" onChange={handleCsvUpload} />
            
            {csvData.length > 0 && (
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowDataDialog(true)}>
                <TableIcon className="w-4 h-4" />
                View Data
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button 
            variant={showGrid ? "secondary" : "ghost"} 
            size="icon" 
            onClick={() => setShowGrid(!showGrid)}
            title="Toggle Grid"
            className="h-8 w-8"
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-2 mr-4">
            <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(0.1, z - 0.1))}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs font-medium w-12 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(3, z + 0.1))}>
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          <Button 
            variant={previewRowIndex !== null ? "secondary" : "outline"} 
            size="sm" 
            className="gap-2" 
            onClick={togglePreview}
          >
            <Play className="w-4 h-4" />
            {previewRowIndex !== null ? 'Exit Preview' : 'Preview'}
          </Button>
          
          {previewRowIndex !== null && (
            <div className="flex items-center gap-2 text-sm">
              <Button variant="ghost" size="sm" onClick={() => setPreviewRowIndex(Math.max(0, previewRowIndex - 1))}>Prev</Button>
              <span>{previewRowIndex + 1} / {csvData.length}</span>
              <Button variant="ghost" size="sm" onClick={() => setPreviewRowIndex(Math.min(csvData.length - 1, previewRowIndex + 1))}>Next</Button>
            </div>
          )}

          <div className="h-6 w-px bg-slate-200 mx-2" />

          <Button variant="outline" size="sm" className="gap-2" onClick={() => document.getElementById('load-template')?.click()}>
            <FileJson className="w-4 h-4" />
            Load
          </Button>
          <input id="load-template" type="file" accept=".json" className="hidden" onChange={handleLoadTemplate} />

          <Button variant="outline" size="sm" className="gap-2" onClick={handleSaveTemplate}>
            <Save className="w-4 h-4" />
            Save
          </Button>

          <Button size="sm" className="gap-2 bg-slate-900 text-white hover:bg-slate-800" onClick={handleGenerateClick}>
            <Download className="w-4 h-4" />
            Generate All
          </Button>
        </div>
      </header>

      <Dialog open={showDataDialog} onOpenChange={setShowDataDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Data Preview</DialogTitle>
            <DialogDescription>
              Showing {csvData.length} rows loaded from your file.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 border rounded-md mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  {csvData.length > 0 && Object.keys(csvData[0]).map((col) => (
                    <TableHead key={col}>{col}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {csvData.slice(0, 100).map((row, i) => (
                  <TableRow key={i}>
                    {Object.values(row).map((val, j) => (
                      <TableCell key={j}>{val}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
          {csvData.length > 100 && (
            <p className="text-xs text-slate-500 mt-2 text-center">Showing first 100 rows</p>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Certificates</DialogTitle>
            <DialogDescription>
              You are about to generate {csvData.length} certificates. Select the output format and naming convention.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Output Format</Label>
              <Select value={format} onValueChange={(val: 'pdf' | 'pdf-single' | 'png') => setFormat(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">Individual PDFs (.zip)</SelectItem>
                  <SelectItem value="pdf-single">Single Multi-page PDF (.pdf)</SelectItem>
                  <SelectItem value="png">Individual PNGs (.zip)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>File Naming (Optional)</Label>
              <Select value={fileNameColumn} onValueChange={setFileNameColumn}>
                <SelectTrigger>
                  <SelectValue placeholder="Default (certificate_1, certificate_2...)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Default (certificate_1, certificate_2...)</SelectItem>
                  {csvColumns.map(col => (
                    <SelectItem key={col} value={col}>Use column: {col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Select a column to use for naming the generated files. Special characters will be removed.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>Cancel</Button>
            <Button onClick={startGeneration}>Start Generation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isGenerating}>
        <DialogContent className="sm:max-w-md [&>button]:hidden">
          <DialogHeader>
            <DialogTitle>Generating Certificates...</DialogTitle>
            <DialogDescription>
              Please wait while your certificates are being generated.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <div className="w-full bg-slate-200 rounded-full h-2.5">
              <div className="bg-slate-900 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="text-center text-sm mt-2 text-slate-500">{progress}% Complete</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
