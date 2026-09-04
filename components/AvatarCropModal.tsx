'use client';

import { useEffect, useRef, useState } from 'react';

const PREVIEW_SIZE = 280;
const OUTPUT_SIZE = 512;

// Recortador simple de avatar: arrastrar para mover la foto y un slider
// para acercar, todo dentro de un marco circular que es justo lo que
// termina viéndose en el sitio. Existe porque muchas fotos (sobre todo las
// generadas por herramientas de IA) traen relleno o una marca de agua
// pegada al borde — sin poder recortarlas, el avatar circular las mostraba
// chiquitas y "cortadas". Genera un JPEG cuadrado ya encuadrado para subir.
export default function AvatarCropModal({
  file,
  onCancel,
  onCropped,
}: {
  file: File;
  onCancel: () => void;
  onCropped: (blob: Blob) => void;
}) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgUrl] = useState(() => URL.createObjectURL(file));
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, offX: 0, offY: 0 });

  // Sin URL.revokeObjectURL en un cleanup: en dev, el doble montaje de
  // React Strict Mode dispara ese cleanup casi de inmediato y revoca la URL
  // antes de que la imagen llegue a cargar. El navegador libera los blob:
  // URLs solos al salir de la página, así que no vale la pena el riesgo.
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  // Escala base para que la foto cubra el marco de PREVIEW_SIZE x PREVIEW_SIZE
  // a zoom=1 (igual que object-cover) — de ahí el slider solo acerca más.
  const baseScale = naturalSize.w && naturalSize.h ? Math.max(PREVIEW_SIZE / naturalSize.w, PREVIEW_SIZE / naturalSize.h) : 1;
  const scale = baseScale * zoom;
  const displayW = naturalSize.w * scale;
  const displayH = naturalSize.h * scale;

  function clampOffset(x: number, y: number) {
    const maxX = Math.max(0, (displayW - PREVIEW_SIZE) / 2);
    const maxY = Math.max(0, (displayH - PREVIEW_SIZE) / 2);
    return { x: Math.min(maxX, Math.max(-maxX, x)), y: Math.min(maxY, Math.max(-maxY, y)) };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, offX: offset.x, offY: offset.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setOffset(clampOffset(dragStart.current.offX + dx, dragStart.current.offY + dy));
  }
  function handlePointerUp() {
    setDragging(false);
  }

  function handleZoomChange(next: number) {
    setZoom(next);
    setOffset((o) => clampOffset(o.x, o.y));
  }

  function confirmCrop() {
    const img = imgRef.current;
    if (!img || !naturalSize.w) return;
    setSaving(true);
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setSaving(false);
      return;
    }
    const outScale = OUTPUT_SIZE / PREVIEW_SIZE;
    const imgLeft = PREVIEW_SIZE / 2 - displayW / 2 + offset.x;
    const imgTop = PREVIEW_SIZE / 2 - displayH / 2 + offset.y;
    ctx.drawImage(img, imgLeft * outScale, imgTop * outScale, displayW * outScale, displayH * outScale);
    canvas.toBlob(
      (blob) => {
        setSaving(false);
        if (blob) onCropped(blob);
      },
      'image/jpeg',
      0.92
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl w-full max-w-sm space-y-4">
        <h3 className="text-lg font-bold">Ajusta tu foto</h3>

        <div
          className="relative mx-auto rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-800 cursor-move touch-none select-none"
          style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={imgUrl}
            alt=""
            draggable={false}
            onLoad={(e) => setNaturalSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
            className="absolute pointer-events-none max-w-none"
            style={
              displayW
                ? {
                    width: displayW,
                    height: displayH,
                    left: PREVIEW_SIZE / 2 + offset.x,
                    top: PREVIEW_SIZE / 2 + offset.y,
                    transform: 'translate(-50%, -50%)',
                  }
                : { opacity: 0 }
            }
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500 shrink-0">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => handleZoomChange(Number(e.target.value))}
            className="flex-1"
          />
        </div>
        <p className="text-[11px] text-neutral-500 text-center">Arrastra la foto para moverla y usa el control para acercar.</p>

        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2 rounded-lg bg-neutral-200 dark:bg-neutral-700">
            Cancelar
          </button>
          <button
            onClick={confirmCrop}
            disabled={saving || !naturalSize.w}
            className="flex-1 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-pink-500 hover:opacity-90 text-white font-bold disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Usar esta foto'}
          </button>
        </div>
      </div>
    </div>
  );
}
