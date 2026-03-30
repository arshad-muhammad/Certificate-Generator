import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TextPlaceholder } from '../types';
import { Plus, Trash2, Type, GripVertical, Copy } from 'lucide-react';

interface SidebarLeftProps {
  placeholders: TextPlaceholder[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  addPlaceholder: () => void;
  deletePlaceholder: (id: string) => void;
  duplicatePlaceholder: (id: string) => void;
  csvColumns: string[];
  updatePlaceholder: (id: string, updates: Partial<TextPlaceholder>) => void;
}

export function SidebarLeft({
  placeholders,
  selectedId,
  setSelectedId,
  addPlaceholder,
  deletePlaceholder,
  duplicatePlaceholder,
  csvColumns,
  updatePlaceholder,
}: SidebarLeftProps) {
  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col h-full shrink-0 shadow-sm z-10">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="font-semibold text-sm tracking-tight text-slate-800">Fields</h2>
        <Button variant="ghost" size="icon" onClick={() => addPlaceholder()} className="h-8 w-8 text-slate-500 hover:text-slate-900">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="flex flex-col gap-2">
          {placeholders.length === 0 ? (
            <div className="text-center text-sm text-slate-400 py-8 px-4">
              Click the + button to add a text field to your certificate.
            </div>
          ) : (
            placeholders.map((p) => (
              <div
                key={p.id}
                className={`group flex flex-col gap-2 p-3 rounded-lg border transition-all cursor-pointer ${
                  selectedId === p.id
                    ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
                onClick={() => setSelectedId(p.id)}
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-slate-400 cursor-grab opacity-50 group-hover:opacity-100" />
                  <Type className="w-4 h-4 text-slate-500" />
                  <Input
                    value={p.label}
                    onChange={(e) => updatePlaceholder(p.id, { label: e.target.value })}
                    className="h-7 text-sm font-medium bg-transparent border-transparent hover:border-slate-200 focus:bg-white px-1"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex items-center ml-auto opacity-0 group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-slate-400 hover:text-blue-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicatePlaceholder(p.id);
                      }}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-slate-400 hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePlaceholder(p.id);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="pl-6 pr-1">
                  <Select
                    value={p.columnName || 'unmapped'}
                    onValueChange={(val) => updatePlaceholder(p.id, { columnName: val === 'unmapped' ? '' : val })}
                  >
                    <SelectTrigger className="h-7 text-xs bg-white">
                      <SelectValue placeholder="Map to column..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unmapped" className="text-slate-400 italic">Unmapped (Static Text)</SelectItem>
                      {csvColumns.map((col) => (
                        <SelectItem key={col} value={col}>
                          {col}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
