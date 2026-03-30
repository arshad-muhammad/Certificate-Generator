import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Text, Transformer, Line } from 'react-konva';
import useImage from 'use-image';
import { TextPlaceholder, TemplateConfig, CsvRow } from '../types';
import { toast } from 'sonner';

interface CanvasEditorProps {
  config: TemplateConfig;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  updatePlaceholder: (id: string, updates: Partial<TextPlaceholder>) => void;
  previewData: CsvRow | null;
  zoom: number;
  addPlaceholder: (x: number, y: number) => void;
  showGrid: boolean;
}

const PlaceholderNode = ({
  placeholder,
  isSelected,
  onSelect,
  onChange,
  onDragMove,
  onDragEnd,
  previewData,
}: {
  placeholder: TextPlaceholder;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: Partial<TextPlaceholder>) => void;
  onDragMove: (e: any) => void;
  onDragEnd: (e: any) => void;
  previewData: CsvRow | null;
}) => {
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  let displayText = placeholder.text;
  if (previewData && placeholder.columnName && previewData[placeholder.columnName]) {
    displayText = previewData[placeholder.columnName];
  }

  if (placeholder.textTransform === 'uppercase') displayText = displayText.toUpperCase();
  if (placeholder.textTransform === 'lowercase') displayText = displayText.toLowerCase();
  if (placeholder.textTransform === 'capitalize') {
    displayText = displayText.replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return (
    <>
      <Text
        ref={shapeRef}
        x={placeholder.x}
        y={placeholder.y}
        text={displayText}
        fontSize={placeholder.fontSize}
        fontFamily={placeholder.fontFamily}
        fontStyle={`${placeholder.fontWeight === 'bold' ? 'bold' : ''} ${placeholder.fontStyle === 'italic' ? 'italic' : ''}`.trim() || 'normal'}
        fill={placeholder.fill}
        align={placeholder.align}
        width={placeholder.width}
        letterSpacing={placeholder.letterSpacing}
        lineHeight={placeholder.lineHeight}
        opacity={placeholder.opacity}
        rotation={placeholder.rotation}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
        onTransformEnd={(e) => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          
          node.scaleX(1);
          node.scaleY(1);

          onChange({
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            width: Math.max(5, node.width() * scaleX),
            fontSize: Math.max(5, node.fontSize() * scaleY),
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right']}
        />
      )}
    </>
  );
};

export function CanvasEditor({
  config,
  selectedId,
  setSelectedId,
  updatePlaceholder,
  previewData,
  zoom,
  addPlaceholder,
  showGrid,
}: CanvasEditorProps) {
  const [image] = useImage(config.backgroundImage || '');
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [guides, setGuides] = useState<{ type: 'vertical' | 'horizontal', position: number }[]>([]);

  useEffect(() => {
    const checkSize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  const handleStageClick = (e: any) => {
    const clickedOnEmpty = e.target === e.target.getStage() || e.target.hasName('bg-image') || e.target.hasName('grid-line');
    if (clickedOnEmpty) {
      setSelectedId(null);
    }
  };

  const handleStageDblClick = (e: any) => {
    const clickedOnEmpty = e.target === e.target.getStage() || e.target.hasName('bg-image') || e.target.hasName('grid-line');
    if (clickedOnEmpty) {
      const stage = e.target.getStage();
      const pointerPosition = stage.getPointerPosition();
      if (pointerPosition) {
        // Adjust for zoom and stage position
        const x = (pointerPosition.x - stage.x()) / zoom;
        const y = (pointerPosition.y - stage.y()) / zoom;
        addPlaceholder(x, y);
      }
    }
  };

  // Keyboard movement
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedId) return;
      
      // Don't move if typing in an input
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      const p = config.placeholders.find(p => p.id === selectedId);
      if (!p) return;

      const step = e.shiftKey ? 10 : 1;
      let newX = p.x;
      let newY = p.y;

      switch (e.key) {
        case 'ArrowUp': newY -= step; break;
        case 'ArrowDown': newY += step; break;
        case 'ArrowLeft': newX -= step; break;
        case 'ArrowRight': newX += step; break;
        case 'Delete': 
        case 'Backspace':
          break;
        default: return;
      }

      e.preventDefault();
      updatePlaceholder(selectedId, { x: newX, y: newY });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, config.placeholders, updatePlaceholder]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'image/png' || file.type === 'image/jpeg') {
        const reader = new FileReader();
        reader.onload = (event) => {
          const customEvent = new CustomEvent('template-drop', { 
            detail: {
              dataUrl: event.target?.result,
              fileName: file.name
            }
          });
          window.dispatchEvent(customEvent);
        };
        reader.readAsDataURL(file);
      } else {
        toast.error('Please drop a PNG or JPEG image');
      }
    }
  };

  const handleDragMove = (e: any, id: string) => {
    const node = e.target;
    const x = node.x();
    const y = node.y();
    const width = node.width() * node.scaleX();
    const height = node.height() * node.scaleY();
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    const snapThreshold = 10;
    const newGuides: { type: 'vertical' | 'horizontal', position: number }[] = [];

    let newX = x;
    let newY = y;

    // Snap to canvas center
    if (image) {
      const canvasCenterX = image.width / 2;
      const canvasCenterY = image.height / 2;

      if (Math.abs(centerX - canvasCenterX) < snapThreshold) {
        newX = canvasCenterX - width / 2;
        newGuides.push({ type: 'vertical', position: canvasCenterX });
      }

      if (Math.abs(centerY - canvasCenterY) < snapThreshold) {
        newY = canvasCenterY - height / 2;
        newGuides.push({ type: 'horizontal', position: canvasCenterY });
      }
    }

    // Snap to other placeholders
    config.placeholders.forEach(p => {
      if (p.id === id) return;
      
      // Vertical alignment (left, center, right)
      if (Math.abs(x - p.x) < snapThreshold) {
        newX = p.x;
        newGuides.push({ type: 'vertical', position: p.x });
      } else if (Math.abs(centerX - (p.x + p.width / 2)) < snapThreshold) {
        newX = p.x + p.width / 2 - width / 2;
        newGuides.push({ type: 'vertical', position: p.x + p.width / 2 });
      } else if (Math.abs(x + width - (p.x + p.width)) < snapThreshold) {
        newX = p.x + p.width - width;
        newGuides.push({ type: 'vertical', position: p.x + p.width });
      }

      // Horizontal alignment (top, bottom)
      if (Math.abs(y - p.y) < snapThreshold) {
        newY = p.y;
        newGuides.push({ type: 'horizontal', position: p.y });
      }
    });

    node.position({ x: newX, y: newY });
    setGuides(newGuides);
  };

  const handleDragEnd = (e: any, id: string) => {
    setGuides([]);
    updatePlaceholder(id, { x: e.target.x(), y: e.target.y() });
  };

  // Calculate centered position
  let stageX = 0;
  let stageY = 0;
  
  if (image) {
    const scaledWidth = image.width * zoom;
    const scaledHeight = image.height * zoom;
    stageX = Math.max(0, (stageSize.width - scaledWidth) / 2);
    stageY = Math.max(0, (stageSize.height - scaledHeight) / 2);
  }

  // Generate grid lines
  const gridLines = [];
  if (showGrid && image) {
    const gridSize = 50;
    for (let i = 0; i < image.width / gridSize; i++) {
      gridLines.push(
        <Line
          key={`v-${i}`}
          points={[Math.round(i * gridSize) + 0.5, 0, Math.round(i * gridSize) + 0.5, image.height]}
          stroke="#cbd5e1"
          strokeWidth={1 / zoom}
          name="grid-line"
          listening={false}
        />
      );
    }
    for (let j = 0; j < image.height / gridSize; j++) {
      gridLines.push(
        <Line
          key={`h-${j}`}
          points={[0, Math.round(j * gridSize) + 0.5, image.width, Math.round(j * gridSize) + 0.5]}
          stroke="#cbd5e1"
          strokeWidth={1 / zoom}
          name="grid-line"
          listening={false}
        />
      );
    }
  }

  return (
    <div 
      ref={containerRef} 
      className={`w-full h-full relative overflow-auto rounded-xl border-2 shadow-inner flex items-center justify-center transition-colors ${
        isDraggingOver ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 bg-slate-100/50'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {!config.backgroundImage ? (
        <div className="text-center text-slate-400 p-8 pointer-events-none">
          <p className="mb-2">No template uploaded.</p>
          <p className="text-sm">Drag and drop a PNG/JPEG here, or click "Upload Template" in the top bar.</p>
        </div>
      ) : (
        <Stage
          width={stageSize.width}
          height={stageSize.height}
          onClick={handleStageClick}
          onDblClick={handleStageDblClick}
          x={stageX}
          y={stageY}
          scaleX={zoom}
          scaleY={zoom}
          className="shadow-md bg-white"
        >
          <Layer>
            {image && (
              <KonvaImage
                image={image}
                name="bg-image"
                width={image.width}
                height={image.height}
              />
            )}
            {gridLines}
            {config.placeholders.map((placeholder) => (
              <PlaceholderNode
                key={placeholder.id}
                placeholder={placeholder}
                isSelected={placeholder.id === selectedId}
                onSelect={() => setSelectedId(placeholder.id)}
                onChange={(newAttrs) => updatePlaceholder(placeholder.id, newAttrs)}
                onDragMove={(e) => handleDragMove(e, placeholder.id)}
                onDragEnd={(e) => handleDragEnd(e, placeholder.id)}
                previewData={previewData}
              />
            ))}
            
            {/* Draw Guides */}
            {guides.map((guide, i) => {
              if (guide.type === 'vertical') {
                return (
                  <Line
                    key={`guide-${i}`}
                    points={[guide.position, 0, guide.position, image ? image.height : 2000]}
                    stroke="#3b82f6"
                    strokeWidth={1 / zoom}
                    dash={[4 / zoom, 4 / zoom]}
                  />
                );
              } else {
                return (
                  <Line
                    key={`guide-${i}`}
                    points={[0, guide.position, image ? image.width : 2000, guide.position]}
                    stroke="#3b82f6"
                    strokeWidth={1 / zoom}
                    dash={[4 / zoom, 4 / zoom]}
                  />
                );
              }
            })}
          </Layer>
        </Stage>
      )}
    </div>
  );
}
