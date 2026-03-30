export interface TextPlaceholder {
  id: string;
  label: string;
  columnName: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height?: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  fill: string;
  align: 'left' | 'center' | 'right';
  letterSpacing: number;
  lineHeight: number;
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  opacity: number;
  rotation: number;
}

export interface TemplateConfig {
  backgroundImage: string | null; // Data URL
  backgroundName?: string; // Original file name
  placeholders: TextPlaceholder[];
  customFonts: { name: string; dataUrl: string }[];
}

export interface CsvRow {
  [key: string]: string;
}
