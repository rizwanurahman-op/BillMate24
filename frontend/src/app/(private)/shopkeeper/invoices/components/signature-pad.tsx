'use client';

import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, CheckCircle2 } from 'lucide-react';

interface SignaturePadProps {
    onSave: (signature: string) => void;
    onClear: () => void;
    initialSignature?: string;
}

export function SignaturePad({ onSave, onClear, initialSignature }: SignaturePadProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasContent, setHasContent] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set line style
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (initialSignature && initialSignature.startsWith('data:image')) {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0);
                setHasContent(true);
            };
            img.src = initialSignature;
        }
    }, [initialSignature]);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        draw(e);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas && hasContent) {
            onSave(canvas.toDataURL());
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const rect = canvas.getBoundingClientRect();
        let x, y;

        if ('touches' in e) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        }

        if (!hasContent) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            setHasContent(true);
        } else {
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasContent(false);
        onClear();
    };

    return (
        <div className="space-y-4">
            <div className="relative border-2 border-dashed border-gray-300 rounded-xl bg-white overflow-hidden shadow-inner">
                <canvas
                    ref={canvasRef}
                    width={400}
                    height={150}
                    className="w-full h-[150px] cursor-crosshair touch-none"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
                {!hasContent && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-400 text-sm italic">
                        Sign here...
                    </div>
                )}
            </div>
            <div className="flex gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearCanvas}
                    className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                    <Trash2 className="h-4 w-4" />
                    Clear
                </Button>
                {hasContent && (
                    <div className="flex items-center gap-2 text-emerald-600 text-xs font-semibold ml-auto animate-in fade-in zoom-in duration-300">
                        <CheckCircle2 className="h-4 w-4" />
                        Signature Captured
                    </div>
                )}
            </div>
        </div>
    );
}
