/** @jsxImportSource react */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, RotateCcw, Copy, Check, Type, Move, Palette, Box, AlignLeft, AlignCenter, AlignRight, Layout, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  selectedEl: HTMLElement | null;
  clearSelection: () => void;
  onUpdate: () => void;
};

type Align = "left" | "center" | "right";

const fontSizes = Array.from({ length: 12 }, (_, i) => 12 + i * 4); // 12..56
const fontWeights = ["400", "500", "600", "700", "800"];
const lineHeights = ["normal", "1.2", "1.4", "1.6", "1.8", "2"];

export function ElementSettings({ selectedEl, clearSelection, onUpdate }: Props) {
  const [classes, setClasses] = useState<string[]>([]);
  const [newClass, setNewClass] = useState<string>("");
  const [align, setAlign] = useState<Align>("left");
  const [fontSize, setFontSize] = useState<string>("16px");
  const [fontWeight, setFontWeight] = useState<string>("400");
  const [lineHeight, setLineHeight] = useState<string>("1.4");
  const [letterSpacing, setLetterSpacing] = useState<string>("0px");
  const [color, setColor] = useState<string>("#ffffff");
  const [background, setBackground] = useState<string>("#000000");
  const [borderRadius, setBorderRadius] = useState<string>("");
  const [padding, setPadding] = useState<string>("");
  const [margin, setMargin] = useState<string>("");
  const [textContent, setTextContent] = useState<string>("");
  const [opacity, setOpacity] = useState<string>("1");
  const [boxShadow, setBoxShadow] = useState<string>("");
  const [initialInlineStyle, setInitialInlineStyle] = useState<string>("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle"
  );

  const label = useMemo(() => {
    if (!selectedEl) return "";
    const tag = selectedEl.tagName.toLowerCase();
    const id = selectedEl.id ? `#${selectedEl.id}` : "";
    const cls =
      typeof selectedEl.className === "string" && selectedEl.className.trim()
        ? `.${selectedEl.className.trim().replace(/\s+/g, ".")}`
        : "";
    return `${tag}${id}${cls}`;
  }, [selectedEl]);

  const applyStyle = (property: string, value: string) => {
    if (!selectedEl) return;
    if (value === "") {
      selectedEl.style.removeProperty(property);
    } else {
      selectedEl.style[property as any] = value;
    }
    onUpdate();
  };

  const syncFromElement = (el: HTMLElement) => {
    const computed = getComputedStyle(el);
    setAlign(
      (el.style.textAlign as Align) ||
        (el.getAttribute("align") as Align) ||
        (computed.textAlign as Align) ||
        "left"
    );
    setFontSize(el.style.fontSize || computed.fontSize || "16px");
    setFontWeight(el.style.fontWeight || computed.fontWeight || "400");
    setLineHeight(el.style.lineHeight || computed.lineHeight || "1.4");
    setLetterSpacing(el.style.letterSpacing || computed.letterSpacing || "0px");
    
    // Normalize color values to hex for picker
    const toHex = (rgb: string) => {
        if (!rgb || rgb === "transparent") return "#000000";
        const res = rgb.match(/\d+/g);
        if (!res || res.length < 3) return "#000000";
        return "#" + res.slice(0, 3).map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
    };

    setColor(toHex(el.style.color || computed.color));
    setBackground(toHex(el.style.backgroundColor || computed.backgroundColor));
    setBorderRadius(el.style.borderRadius || computed.borderRadius || "");
    setPadding(el.style.padding || computed.padding || "");
    setMargin(el.style.margin || computed.margin || "");
    setOpacity(el.style.opacity || computed.opacity || "1");
    setBoxShadow(el.style.boxShadow || computed.boxShadow || "");
    setTextContent(el.textContent || "");
    setInitialInlineStyle(el.getAttribute("style") || "");
  };

  useEffect(() => {
    if (!selectedEl) return;
    syncFromElement(selectedEl);
  }, [selectedEl]);

  useEffect(() => {
    if (!selectedEl) return;
    
    // Handle className as string (for regular elements) or SVGAnimatedString (for SVG elements)
    const classNameStr = typeof selectedEl.className === 'string' 
      ? selectedEl.className 
      : (selectedEl.className as any)?.baseVal || '';
    
    const current = classNameStr
      .split(" ")
      .map((c: string) => c.trim())
      .filter(Boolean);
    setClasses(current);

    const observer = new MutationObserver(() => {
      const classNameStr = typeof selectedEl.className === 'string' 
        ? selectedEl.className 
        : (selectedEl.className as any)?.baseVal || '';
      
      const updated = classNameStr
        .split(" ")
        .map((c: string) => c.trim())
        .filter(Boolean);
      setClasses(updated);
    });

    observer.observe(selectedEl, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [selectedEl]);

  const removeClass = (cls: string) => {
    if (!selectedEl) return;
    const updated = classes.filter((c) => c !== cls);
    setClasses(updated);
    selectedEl.className = updated.join(" ");
    onUpdate();
  };

  const addClass = () => {
    if (!selectedEl) return;
    const trimmed = newClass.trim();
    if (!trimmed || classes.includes(trimmed)) {
      setNewClass("");
      return;
    }
    const updated = [...classes, trimmed];
    setClasses(updated);
    selectedEl.className = updated.join(" ");
    setNewClass("");
    onUpdate();
  };

  const resetInlineStyles = () => {
    if (!selectedEl) return;
    selectedEl.setAttribute("style", initialInlineStyle);
    syncFromElement(selectedEl);
    onUpdate();
  };

  const copySelector = async () => {
    if (!label) return;
    try {
      await navigator.clipboard.writeText(label);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 1500);
    } catch {
      setCopyState("error");
      setTimeout(() => setCopyState("idle"), 1500);
    }
  };

  if (!selectedEl) return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center gap-4 text-zinc-500">
        <div className="size-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <Move className="size-6 opacity-20" />
        </div>
        <div className="space-y-1">
            <p className="text-sm font-bold text-zinc-300">No element selected</p>
            <p className="text-[11px] leading-relaxed">Click any component in the preview to adjust its properties.</p>
        </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-zinc-950 animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
        <div className="flex flex-col">
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-0.5">Properties</span>
            <span className="text-[13px] font-bold text-zinc-100 truncate max-w-[180px]">{label}</span>
        </div>
        <Button onClick={clearSelection} variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5">
            <X className="size-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-6">
        {/* Actions */}
        <div className="grid grid-cols-2 gap-2">
            <Button onClick={resetInlineStyles} variant="outline" className="h-9 text-[11px] font-bold border-zinc-800 bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl gap-2">
                <RotateCcw className="size-3.5" />
                RESET
            </Button>
            <Button onClick={copySelector} variant="outline" className="h-9 text-[11px] font-bold border-zinc-800 bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl gap-2">
                {copyState === "copied" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copyState === "copied" ? "COPIED" : "SELECTOR"}
            </Button>
        </div>

        {/* Typography */}
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <Type className="size-3.5 text-zinc-500" />
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Typography</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-400 ml-1">Size</label>
                    <select
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 appearance-none"
                        value={fontSize}
                        onChange={(e) => applyStyle("fontSize", e.target.value)}
                    >
                        {fontSizes.map((size) => (
                            <option key={size} value={`${size}px`}>{size}px</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-400 ml-1">Weight</label>
                    <select
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 appearance-none"
                        value={fontWeight}
                        onChange={(e) => applyStyle("fontWeight", e.target.value)}
                    >
                        {fontWeights.map((weight) => (
                            <option key={weight} value={weight}>{weight}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-400 ml-1">Line Height</label>
                    <select
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 appearance-none"
                        value={lineHeight}
                        onChange={(e) => applyStyle("lineHeight", e.target.value)}
                    >
                        {lineHeights.map((lh) => (
                            <option key={lh} value={lh}>{lh}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-400 ml-1">Alignment</label>
                    <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1 h-[34px]">
                        {(["left", "center", "right"] as Align[]).map((dir) => (
                            <button
                                key={dir}
                                onClick={() => applyStyle("textAlign", dir)}
                                className={cn(
                                    "flex-1 flex items-center justify-center rounded-lg transition-all",
                                    align === dir ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                                )}
                            >
                                {dir === "left" && <AlignLeft className="size-3.5" />}
                                {dir === "center" && <AlignCenter className="size-3.5" />}
                                {dir === "right" && <AlignRight className="size-3.5" />}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* Colors & Appearance */}
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <Palette className="size-3.5 text-zinc-500" />
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Appearance</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-400 ml-1">Text Color</label>
                    <div className="relative group/color">
                        <input
                            type="color"
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            value={color}
                            onChange={(e) => applyStyle("color", e.target.value)}
                        />
                        <div className="w-full h-9 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center px-3 gap-2 pointer-events-none group-hover/color:border-zinc-700 transition-colors">
                            <div className="size-4 rounded-full border border-white/10" style={{ backgroundColor: color }} />
                            <span className="text-[10px] font-mono text-zinc-400 uppercase">{color}</span>
                        </div>
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-400 ml-1">Background</label>
                    <div className="relative group/color">
                        <input
                            type="color"
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            value={background}
                            onChange={(e) => applyStyle("backgroundColor", e.target.value)}
                        />
                        <div className="w-full h-9 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center px-3 gap-2 pointer-events-none group-hover/color:border-zinc-700 transition-colors">
                            <div className="size-4 rounded-full border border-white/10" style={{ backgroundColor: background }} />
                            <span className="text-[10px] font-mono text-zinc-400 uppercase">{background}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-1.5">
                <div className="flex justify-between ml-1">
                    <label className="text-[11px] font-bold text-zinc-400">Opacity</label>
                    <span className="text-[10px] font-mono text-zinc-500">{Math.round(parseFloat(opacity) * 100)}%</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={opacity}
                    onChange={(e) => applyStyle("opacity", e.target.value)}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 mt-2"
                />
            </div>
        </div>

        {/* Layout & Spacing */}
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <Layout className="size-3.5 text-zinc-500" />
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Layout</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-400 ml-1">Padding</label>
                    <input
                        type="text"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                        placeholder="e.g. 16px"
                        value={padding}
                        onChange={(e) => applyStyle("padding", e.target.value)}
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-400 ml-1">Margin</label>
                    <input
                        type="text"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                        placeholder="e.g. 8px"
                        value={margin}
                        onChange={(e) => applyStyle("margin", e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-400 ml-1">Radius</label>
                    <input
                        type="text"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                        placeholder="e.g. 12px"
                        value={borderRadius}
                        onChange={(e) => applyStyle("borderRadius", e.target.value)}
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-400 ml-1">Shadow</label>
                    <input
                        type="text"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                        placeholder="e.g. 0 4px 10px rgba(0,0,0,0.1)"
                        value={boxShadow}
                        onChange={(e) => applyStyle("boxShadow", e.target.value)}
                    />
                </div>
            </div>
        </div>

        {/* Content */}
        <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
                <Box className="size-3.5 text-zinc-500" />
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Content</span>
            </div>
            
            <textarea
                className="w-full min-h-[80px] bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-none"
                value={textContent}
                onChange={(e) => {
                    setTextContent(e.target.value);
                    if (selectedEl) {
                        selectedEl.textContent = e.target.value;
                        onUpdate();
                    }
                }}
            />
        </div>

        {/* Class Management */}
        <div className="space-y-3">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block ml-1">Classes</span>
            <div className="flex flex-wrap gap-1.5">
                {classes.map((cls) => (
                    <div key={cls} className="group/tag flex items-center gap-1.5 bg-zinc-800/50 border border-white/5 py-1 pl-2.5 pr-1.5 rounded-lg">
                        <span className="text-[10px] font-bold text-zinc-400">{cls}</span>
                        <button onClick={() => removeClass(cls)} className="p-0.5 rounded-md hover:bg-red-400/10 text-zinc-500 hover:text-red-400 transition-colors">
                            <X className="size-3" />
                        </button>
                    </div>
                ))}
            </div>
            <div className="flex gap-2">
                <input
                    type="text"
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                    placeholder="Add Tailwind class..."
                    value={newClass}
                    onChange={(e) => setNewClass(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addClass()}
                />
                <Button onClick={addClass} className="h-9 w-9 p-0 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl">
                    <Plus className="size-4" />
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
}

const Plus = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);
