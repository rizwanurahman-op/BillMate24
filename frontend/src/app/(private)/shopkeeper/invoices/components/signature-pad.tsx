import { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, CheckCircle2, Type, Pencil, Image as ImageIcon, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface SignaturePadProps {
    onSave: (signature: string) => void;
    onClear: () => void;
    initialSignature?: string;
}

export function SignaturePad({ onSave, onClear, initialSignature }: SignaturePadProps) {
    const { t } = useTranslation();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasContent, setHasContent] = useState(false);
    const [mode, setMode] = useState<'draw' | 'type'>('draw');
    const [typedName, setTypedName] = useState('');
    const [selectedFont, setSelectedFont] = useState('Dancing Script, cursive');

    // Drawing context setup
    const setupCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Scale for high DPI screens
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (initialSignature && initialSignature.startsWith('data:image') && mode === 'draw') {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0, rect.width, rect.height);
                setHasContent(true);
            };
            img.src = initialSignature;
        }
    }, [initialSignature, mode]);

    useEffect(() => {
        setupCanvas();
        // Add font link if not present
        if (!document.getElementById('signature-fonts')) {
            const link = document.createElement('link');
            link.id = 'signature-fonts';
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Great+Vibes&family=Sacramento&display=swap';
            document.head.appendChild(link);
        }
    }, [setupCanvas]);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

        ctx.lineTo(x, y);
        ctx.stroke();
        setHasContent(true);
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas && hasContent) {
            onSave(canvas.toDataURL('image/png'));
        }
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasContent(false);
        setTypedName('');
        onClear();
    };

    const handleTypeSignature = (name: string) => {
        setTypedName(name);
        if (!name.trim()) {
            setHasContent(false);
            onClear();
            return;
        }

        // Use a hidden canvas to generate the signature image
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = `bold 120px ${selectedFont}`;
            ctx.fillStyle = '#1e293b';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(name, canvas.width / 2, canvas.height / 2);

            const dataUrl = canvas.toDataURL('image/png');
            onSave(dataUrl);
            setHasContent(true);
        }
    };

    const fontOptions = [
        { name: 'Modern Cursive', value: "'Dancing Script', cursive" },
        { name: 'Elegant', value: "'Great Vibes', cursive" },
        { name: 'Classic', value: "'Sacramento', cursive" },
    ];

    return (
        <div className="space-y-6">
            <Tabs value={mode} onValueChange={(v) => {
                setMode(v as 'draw' | 'type');
                setHasContent(false);
                onClear();
            }} className="w-full">
                <TabsList className="grid w-full grid-cols-2 p-1 bg-gray-100 rounded-xl">
                    <TabsTrigger value="draw" className="rounded-lg gap-2 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Pencil className="h-4 w-4" />
                        {t('invoices.draw')}
                    </TabsTrigger>
                    <TabsTrigger value="type" className="rounded-lg gap-2 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Type className="h-4 w-4" />
                        {t('invoices.type')}
                    </TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    <TabsContent value="draw" className="m-0 space-y-4">
                        <div className="relative border-2 border-dashed border-gray-200 rounded-2xl bg-white overflow-hidden shadow-sm hover:border-purple-300 transition-colors">
                            <canvas
                                ref={canvasRef}
                                className="w-full h-[200px] cursor-crosshair touch-none"
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={stopDrawing}
                            />
                            {!hasContent && !isDrawing && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-gray-400">
                                    <ImageIcon className="h-10 w-10 mb-2 opacity-20" />
                                    <p className="text-sm font-medium italic">{t('invoices.sign_here')}</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="type" className="m-0 space-y-4">
                        <div className="space-y-4">
                            <Input
                                value={typedName}
                                onChange={(e) => handleTypeSignature(e.target.value)}
                                placeholder={t('invoices.type_full_name')}
                                className="h-14 text-lg border-2 border-gray-100 focus:border-indigo-500 rounded-xl"
                            />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {fontOptions.map((f, i) => (
                                    <button
                                        key={f.value}
                                        type="button"
                                        onClick={() => {
                                            setSelectedFont(f.value);
                                            handleTypeSignature(typedName);
                                        }}
                                        className={cn(
                                            "p-4 rounded-xl border-2 transition-all text-center",
                                            selectedFont === f.value
                                                ? "border-indigo-600 bg-indigo-50/50 shadow-sm"
                                                : "border-gray-100 bg-white hover:border-gray-200"
                                        )}
                                    >
                                        <p className="text-xs text-gray-500 mb-2 font-bold uppercase tracking-wider">
                                            {i === 0 ? t('invoices.modern_cursive') : i === 1 ? t('invoices.elegant') : t('invoices.classic')}
                                        </p>
                                        <p style={{ fontFamily: f.value }} className="text-2xl text-gray-900 truncate px-2">
                                            {typedName || (i === 1 ? 'Signature' : 'Signature')}
                                        </p>
                                    </button>
                                ))}
                            </div>

                            {hasContent && typedName && (
                                <div className="p-10 border-2 border-gray-50 bg-white rounded-2xl flex items-center justify-center shadow-inner overflow-hidden min-h-[150px]">
                                    <p style={{ fontFamily: selectedFont }} className="text-6xl text-gray-800 break-all text-center leading-normal">
                                        {typedName}
                                    </p>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </div>
            </Tabs>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearCanvas}
                    className="gap-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg px-4"
                >
                    <Trash2 className="h-4 w-4" />
                    {t('invoices.reset_signature')}
                </Button>

                {hasContent && (
                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full text-xs font-bold animate-in fade-in slide-in-from-right-4 duration-300">
                        <CheckCircle2 className="h-4 w-4" />
                        {t('invoices.signature_captured')}
                    </div>
                )}
            </div>
        </div>
    );
}
