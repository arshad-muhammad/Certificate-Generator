import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TextPlaceholder, TemplateConfig } from '../types';
import { AlignLeft, AlignCenter, AlignRight, Bold, Italic, UploadCloud, Type } from 'lucide-react';
import { toast } from 'sonner';

interface SidebarRightProps {
  selectedPlaceholder: TextPlaceholder | null;
  updatePlaceholder: (id: string, updates: Partial<TextPlaceholder>) => void;
  customFonts: { name: string; dataUrl: string }[];
  setConfig: React.Dispatch<React.SetStateAction<TemplateConfig>>;
}

export function SidebarRight({ selectedPlaceholder, updatePlaceholder, customFonts, setConfig }: SidebarRightProps) {
  if (!selectedPlaceholder) {
    return (
      <aside className="w-80 bg-white border-l border-slate-200 flex flex-col h-full shrink-0 shadow-sm z-10 p-6 text-center text-slate-400">
        <Type className="w-12 h-12 mx-auto mb-4 opacity-20" />
        <p className="text-sm">Select a text field to edit its properties.</p>
      </aside>
    );
  }

  const p = selectedPlaceholder;

  const handleFontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const fontName = file.name.split('.')[0];
      
      setConfig((prev) => ({
        ...prev,
        customFonts: [...prev.customFonts, { name: fontName, dataUrl }],
      }));
      
      updatePlaceholder(p.id, { fontFamily: fontName });
      toast.success(`Font ${fontName} uploaded`);
    };
    reader.readAsDataURL(file);
  };

  return (
    <aside className="w-80 bg-white border-l border-slate-200 flex flex-col h-full shrink-0 shadow-sm z-10 overflow-y-auto">
      <div className="p-4 border-b border-slate-100">
        <h2 className="font-semibold text-sm tracking-tight text-slate-800">Formatting</h2>
      </div>

      <div className="p-5 space-y-6">
        {/* Text Value */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Default Text</Label>
          <Input 
            value={p.text} 
            onChange={(e) => updatePlaceholder(p.id, { text: e.target.value })} 
            className="h-9"
          />
        </div>

        {/* Font Family */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Font Family</Label>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => document.getElementById('font-upload')?.click()}>
              <UploadCloud className="w-3.5 h-3.5 text-slate-400" />
            </Button>
            <input id="font-upload" type="file" accept=".ttf,.otf" className="hidden" onChange={handleFontUpload} />
          </div>
          <Select value={p.fontFamily} onValueChange={(val) => updatePlaceholder(p.id, { fontFamily: val })}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select font" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Inter">Inter</SelectItem>
              <SelectItem value="Arial">Arial</SelectItem>
              <SelectItem value="Times New Roman">Times New Roman</SelectItem>
              <SelectItem value="Courier New">Courier New</SelectItem>
              <SelectItem value="Georgia">Georgia</SelectItem>
              {customFonts.map((f) => (
                <SelectItem key={f.name} value={f.name}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Font Size & Color */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Size</Label>
            <Input 
              type="number" 
              value={p.fontSize} 
              onChange={(e) => updatePlaceholder(p.id, { fontSize: Number(e.target.value) })}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Color</Label>
            <div className="flex gap-2">
              <Input 
                type="color" 
                value={p.fill} 
                onChange={(e) => updatePlaceholder(p.id, { fill: e.target.value })}
                className="h-9 w-9 p-1 cursor-pointer"
              />
              <Input 
                type="text" 
                value={p.fill} 
                onChange={(e) => updatePlaceholder(p.id, { fill: e.target.value })}
                className="h-9 flex-1 uppercase text-xs"
              />
            </div>
          </div>
        </div>

        {/* Style & Alignment */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Style & Alignment</Label>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-md">
            <Button 
              variant={p.fontWeight === 'bold' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="flex-1 h-8"
              onClick={() => updatePlaceholder(p.id, { fontWeight: p.fontWeight === 'bold' ? 'normal' : 'bold' })}
            >
              <Bold className="w-4 h-4" />
            </Button>
            <Button 
              variant={p.fontStyle === 'italic' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="flex-1 h-8"
              onClick={() => updatePlaceholder(p.id, { fontStyle: p.fontStyle === 'italic' ? 'normal' : 'italic' })}
            >
              <Italic className="w-4 h-4" />
            </Button>
            <div className="w-px bg-slate-200 mx-1" />
            <Button 
              variant={p.align === 'left' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="flex-1 h-8"
              onClick={() => updatePlaceholder(p.id, { align: 'left' })}
            >
              <AlignLeft className="w-4 h-4" />
            </Button>
            <Button 
              variant={p.align === 'center' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="flex-1 h-8"
              onClick={() => updatePlaceholder(p.id, { align: 'center' })}
            >
              <AlignCenter className="w-4 h-4" />
            </Button>
            <Button 
              variant={p.align === 'right' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="flex-1 h-8"
              onClick={() => updatePlaceholder(p.id, { align: 'right' })}
            >
              <AlignRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Transform */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Transform</Label>
          <Select value={p.textTransform} onValueChange={(val: any) => updatePlaceholder(p.id, { textTransform: val })}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="uppercase">UPPERCASE</SelectItem>
              <SelectItem value="lowercase">lowercase</SelectItem>
              <SelectItem value="capitalize">Capitalize</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Spacing */}
        <div className="space-y-4 pt-2">
          <div className="space-y-3">
            <div className="flex justify-between">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Letter Spacing</Label>
              <span className="text-xs text-slate-400">{p.letterSpacing}px</span>
            </div>
            <Slider 
              value={[p.letterSpacing]} 
              min={-5} max={20} step={0.5}
              onValueChange={(val) => updatePlaceholder(p.id, { letterSpacing: val[0] })}
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Line Height</Label>
              <span className="text-xs text-slate-400">{p.lineHeight}</span>
            </div>
            <Slider 
              value={[p.lineHeight]} 
              min={0.5} max={3} step={0.1}
              onValueChange={(val) => updatePlaceholder(p.id, { lineHeight: val[0] })}
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Opacity</Label>
              <span className="text-xs text-slate-400">{Math.round(p.opacity * 100)}%</span>
            </div>
            <Slider 
              value={[p.opacity]} 
              min={0} max={1} step={0.05}
              onValueChange={(val) => updatePlaceholder(p.id, { opacity: val[0] })}
            />
          </div>
        </div>

      </div>
    </aside>
  );
}
