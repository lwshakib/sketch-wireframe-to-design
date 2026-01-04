"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import {
  Plus,
  ArrowRight,
  ChevronDown,
  Sparkles,
  Search,
  ZoomIn,
  ZoomOut,
  MoreVertical,
  Smartphone,
  Monitor,
  CheckCircle2,
  Globe,
  X,
  Loader2,
  Edit2,
  Columns,
  Share2,
  Maximize2,
  Download,
  RotateCcw,
  MousePointer2,
  SearchIcon,
  Layout,
  MessageSquareIcon,
  Menu,
  Pencil,
  Hand,
  Image as ImageIcon,
  User,
  Zap,
  Code,
  ExternalLink,
  FileText,
  MousePointerClick,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { UserMenu } from "@/components/user-menu";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DefaultChatTransport } from "ai";
import { extractArtifact, stripArtifact } from "@/lib/artifact-renderer";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageAttachments,
  MessageAttachment,
} from "@/components/ai-elements/message";

interface Project {
  id: string;
  title: string;
  messages: any[];
}


const getInjectedHTML = (html: string) => {
  const script = `
    <script>
      const sendHeight = () => {
        window.parent.postMessage({ type: 'HEIGHT_UPDATE', height: document.body.scrollHeight }, '*');
      };
      window.onload = sendHeight;
      new ResizeObserver(sendHeight).observe(document.documentElement);
      setInterval(sendHeight, 1000); // Fail-safe check

      window.addEventListener('message', (event) => {
        if (event.data.type === 'UPDATE_CONTENT') {
          const parser = new DOMParser();
          const newDoc = parser.parseFromString(event.data.content, 'text/html');
          
          // Update head (styles, links)
          const newHead = newDoc.head.innerHTML;
          if (document.head.innerHTML !== newHead) {
            document.head.innerHTML = newHead;
          }

          // Update body
          document.body.innerHTML = newDoc.body.innerHTML;
          
          // Re-trigger height update
          sendHeight();
        }
      });
    </script>
    <style>
      ::-webkit-scrollbar { display: none; }
      body { -ms-overflow-style: none; scrollbar-width: none; margin: 0; padding: 0; background: white; transition: background 0.3s ease; }
      @keyframes shimmer {
        100% { transform: translateX(100%); }
      }
    </style>
  `;
  if (html.toLowerCase().includes('</body>')) {
    return html.replace(/<\/body>/i, `${script}</body>`);
  }
  return `${html}${script}`;
};


export default function ProjectPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const previewRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [attachments, setAttachments] = useState<{ url: string; isUploading: boolean }[]>([]);
  const [input, setInput] = useState("");
  const [currentArtifact, setCurrentArtifact] = useState<{ content: string, type: 'web' | 'app' | 'general', isComplete: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTool, setActiveTool] = useState<'select' | 'hand'>('select');
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [framePos, setFramePos] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [isDraggingFrame, setIsDraggingFrame] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const [dynamicFrameHeight, setDynamicFrameHeight] = useState<number>(800);
  const [throttledArtifact, setThrottledArtifact] = useState<{ content: string, type: 'web' | 'app' | 'general', isComplete: boolean } | null>(null);
  const [isFrameSelected, setIsFrameSelected] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Refs to keep track of state in wheel event listeners without re-attaching
  const zoomRef = useRef(zoom);
  const canvasOffsetRef = useRef(canvasOffset);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { canvasOffsetRef.current = canvasOffset; }, [canvasOffset]);

  const {
    messages,
    sendMessage,
    setMessages,
    status,
    stop,
  } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: {
        projectId,
      },
    }),
    onError: (error) => {
      console.error(error);
      toast.error("Failed to connect to design engine");
    },
    onFinish: (message: any) => {
      const textContent = (message.parts?.find((p: any) => p.type === 'text') as any)?.text || message.content;
      if (typeof textContent === 'string') {
        const artifactData = extractArtifact(textContent);
        if (artifactData) {
          setCurrentArtifact(artifactData);
          setThrottledArtifact(artifactData);
        }
      }
    },
    onData: (data) => {
       // Optional: handle custom data if backend sends it
       console.log(data);
    }
  });

  useEffect(() => {
    const fetchProjectAndInitialize = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        if (!res.ok) throw new Error("Project not found");
        const data = await res.json();
        setProject(data);
        
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        }

        const pendingPromptRaw = sessionStorage.getItem(`pending_prompt_${projectId}`);
        if (pendingPromptRaw) {
          const { content, attachments: initialAttachments } = JSON.parse(pendingPromptRaw);
          sessionStorage.removeItem(`pending_prompt_${projectId}`);
          
          sendMessage({
            text: content,
            files: initialAttachments.map((url: string) => ({ type: "file" as const, url, mediaType: "image/*" })),
          });
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load workspace");
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    if (projectId) fetchProjectAndInitialize();
  }, [projectId, sendMessage, setMessages, router]);

  const lastUpdateRef = useRef(Date.now());
  useEffect(() => {
    const lastAssistantMessage = (messages as any[]).filter(m => m.role === 'assistant').at(-1);
    if (lastAssistantMessage) {
      const textContent = (lastAssistantMessage.parts?.find((p: any) => p.type === 'text') as any)?.text || (lastAssistantMessage as any).content;
      if (typeof textContent === 'string' && textContent.length > 0) {
        const artifactData = extractArtifact(textContent);
        if (artifactData) {
          setCurrentArtifact(artifactData);
          
          // Use a throttled version for the iframe to avoid too many re-renders
          // UNLESS it is complete, then we show it immediately
          const now = Date.now();
          if (artifactData.isComplete || now - lastUpdateRef.current > 1000) {
            setThrottledArtifact(artifactData);
            lastUpdateRef.current = now;
          }
        }
      }
    } else {
      setCurrentArtifact(null);
      setThrottledArtifact(null);
    }
  }, [messages, status]);

  const memoizedInjectedHTML = React.useMemo(() => {
    if (!throttledArtifact) return "";
    return getInjectedHTML(throttledArtifact.content);
  }, [throttledArtifact?.content]);

  // Live update iframe content without reload during streaming
  // This useEffect is now primarily for when throttledArtifact becomes complete
  useEffect(() => {
    if (throttledArtifact && throttledArtifact.isComplete && iframeRef.current) {
      const content = getInjectedHTML(throttledArtifact.content);
      // If the iframe is already rendered, update its content
      // Otherwise, the srcDoc will handle the initial render
      iframeRef.current.contentWindow?.postMessage({
        type: 'UPDATE_CONTENT',
        content
      }, '*');
    }
  }, [throttledArtifact?.content, throttledArtifact?.isComplete]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'HEIGHT_UPDATE' && typeof event.data.height === 'number') {
        setDynamicFrameHeight(event.data.height);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool === 'hand') {
      setIsPanning(true);
      dragStart.current = { x: e.clientX - canvasOffset.x, y: e.clientY - canvasOffset.y };
    }
  };





  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && activeTool === 'hand') {
      setCanvasOffset({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      });
    } else if (isDraggingFrame && activeTool === 'select') {
      setFramePos({
        x: (e.clientX - dragStart.current.x) / zoom,
        y: (e.clientY - dragStart.current.y) / zoom
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsDraggingFrame(false);
  };

  const startDraggingFrame = (e: React.MouseEvent) => {
    if (activeTool === 'select') {
      e.stopPropagation();
      setIsDraggingFrame(true);
      dragStart.current = { x: e.clientX - framePos.x * zoom, y: e.clientY - framePos.y * zoom };
    }
  };

  useEffect(() => {
    const element = previewRef.current;
    if (!element || loading) return;

    const handleGlobalWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };

    const handleWheelNative = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        
        // Consistent scaling factor for smooth zooming
        const scaleFactor = Math.pow(1.2, -e.deltaY / 120);
        const prevZoom = zoomRef.current;
        const prevOffset = canvasOffsetRef.current;
        
        const rect = element.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        
        // Calculate position relative to the center of the container
        const cx = mx - rect.width / 2;
        const cy = my - rect.height / 2;

        const newZoom = Math.min(Math.max(prevZoom * scaleFactor, 0.1), 5);
        
        // Zoom relative to the cursor position
        const worldX = (cx - prevOffset.x) / prevZoom;
        const worldY = (cy - prevOffset.y) / prevZoom;
        
        setZoom(newZoom);
        setCanvasOffset({
          x: cx - worldX * newZoom,
          y: worldY === undefined ? prevOffset.y : cy - worldY * newZoom
        });
      } else {
        setCanvasOffset(prev => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY
        }));
      }
    };

    window.addEventListener('wheel', handleGlobalWheel, { passive: false });
    element.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => {
      window.removeEventListener('wheel', handleGlobalWheel);
      element.removeEventListener('wheel', handleWheelNative);
    };
  }, [loading]);

  const handleWheel = (e: React.WheelEvent) => {
    // This is now handled by the native listener for preventDefault support
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '');
      
      if (e.code === 'Space' && !isInput && !e.repeat) {
        e.preventDefault();
        setActiveTool('hand');
      }
      
      if ((e.ctrlKey || e.metaKey) && !isInput) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          setZoom(prev => Math.min(prev * 1.2, 5));
        } else if (e.key === '-') {
          e.preventDefault();
          setZoom(prev => Math.max(prev / 1.2, 0.1));
        } else if (e.key === '0') {
          e.preventDefault();
          setZoom(1);
          setCanvasOffset({ x: 0, y: 0 });
          setFramePos({ x: 0, y: 0 });
        } else {
          setActiveTool('select');
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setActiveTool('select');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileList = Array.from(files);
    const newPlaceholders = fileList.map(file => ({
      url: URL.createObjectURL(file),
      isUploading: true
    }));
    
    setAttachments(prev => [...prev, ...newPlaceholders]);

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const placeholderUrl = newPlaceholders[i].url;

      try {
        const sigRes = await fetch("/api/cloudinary-signature");
        const sigData = await sigRes.json();
        const uploadApi = `https://api.cloudinary.com/v1_1/${sigData.cloudName}/upload`;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", sigData.apiKey);
        formData.append("timestamp", sigData.timestamp.toString());
        formData.append("signature", sigData.signature);
        formData.append("folder", sigData.folder || "sketch-wireframe-to-design");

        const uploadRes = await fetch(uploadApi, { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        
        setAttachments(prev => prev.map(attr => 
          attr.url === placeholderUrl 
            ? { url: uploadData.secure_url, isUploading: false } 
            : attr
        ));
      } catch (error) {
        console.error("Upload error:", error);
        toast.error(`Failed to upload ${file.name}`);
        setAttachments(prev => prev.filter(attr => attr.url !== placeholderUrl));
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const copyCode = () => {
    if (!currentArtifact) return;
    navigator.clipboard.writeText(currentArtifact.content);
    toast.success("Code copied to clipboard");
  };

  const exportAsHTML = () => {
    if (!currentArtifact) return;
    const fullHTML = getInjectedHTML(currentArtifact.content);
    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `design_${projectId}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Design exported as HTML");
  };

  const openInNewTab = () => {
    if (!currentArtifact) return;
    const fullHTML = getInjectedHTML(currentArtifact.content);
    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && attachments.length === 0) return;
    
    sendMessage({
      text: input.trim() + "\n\n---\n\n" + "Please generate a vertically expansive design. Do not include any internal scrollbars in the generated HTML. The design should be fully visible without scrolling within the iframe, with the iframe's height adjusting to fit the content.",
      files: attachments.map(a => ({ type: "file" as const, url: a.url, mediaType: "image/*" }))
    });
    
    setAttachments([]);
    setInput("");
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
           <Loader2 className="h-8 w-8 animate-spin text-primary" />
           <span className="text-zinc-500 text-sm font-medium">Entering Workspace...</span>
        </div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
      
      {/* Left Sidebar - Chat History */}
      <aside className="w-[380px] flex flex-col border-r bg-sidebar z-20">
        <header className="flex items-center justify-between px-4 py-2 h-14 border-b bg-sidebar">
           <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white">
                <Menu className="h-5 w-5" />
              </Button>
              <span className="font-semibold text-[15px] text-foreground tracking-tight">{project.title}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white ml-2">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
           </div>
           <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white">
              <Columns className="h-4 w-4" />
           </Button>
        </header>

        <div className="flex-1 relative overflow-hidden bg-sidebar">
          <Conversation className="relative h-full">
            <ConversationContent className="p-4 gap-8 scrollbar-hide">
              {messages.length === 0 ? (
                <ConversationEmptyState
                  title="Initialize Workspace"
                  description="Describe your vision to generate the first high-fidelity prototype."
                  icon={<MessageSquareIcon className="size-6 text-primary" />}
                />
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="flex flex-col gap-4">
                    <div className="flex items-start gap-3">
                       {message.role === 'user' ? (
                         <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center">
                            <User className="h-4 w-4 text-zinc-400" />
                         </div>
                       ) : (
                         <div className="h-8 w-8 rounded-full bg-indigo-600/20 flex items-center justify-center border border-indigo-500/20">
                            <Logo iconSize={14} showText={false} showBadge={false} />
                         </div>
                       )}
                       <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-bold text-zinc-100 uppercase tracking-wide">
                               {message.role === 'user' ? 'Professor' : 'Stitch'}
                            </span>
                            {message.role === 'assistant' && (
                              <div className="flex items-center gap-1.5 bg-muted px-2 py-0.5 rounded-full border shadow-sm">
                                <span className="text-[10px] font-medium text-muted-foreground">Thinking with 3 Pro</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-2 pl-0">
                            <MessageContent className="p-0 bg-transparent text-foreground leading-relaxed text-[14px]">
                              {message.parts?.map((part: any, i: number) => {
                                if (part.type === 'text') {
                                  const textContent = typeof part.text === 'string' ? part.text : part.text?.text;
                                  if (!textContent) return null;
                                  return (
                                    <div key={i} className="whitespace-pre-wrap">
                                       {message.role === 'assistant' ? (
                                         <MessageResponse>{stripArtifact(textContent)}</MessageResponse>
                                       ) : (
                                         textContent
                                       )}
                                    </div>
                                  );
                                }
                                if (part.type === 'file') {
                                  const fileUrl = typeof part.file === 'string' ? part.file : part.file?.url;
                                  if (!fileUrl) return null;
                                  return (
                                    <div key={i} className="mt-3 rounded-xl overflow-hidden border border-zinc-800 shadow-xl max-w-[200px]">
                                       <img src={fileUrl} alt="Design Reference" className="w-full h-auto object-cover" />
                                    </div>
                                  );
                                }
                                return null;
                              })}
                              
                              {!message.parts && (
                                <div className="whitespace-pre-wrap">
                                   {message.role === 'assistant' ? (
                                     <MessageResponse>{stripArtifact((message as any).content)}</MessageResponse>
                                   ) : (
                                     (message as any).content
                                   )}
                                </div>
                              )}
                            </MessageContent>
                          </div>
                       </div>
                    </div>
                  </div>
                ))
              )}
            </ConversationContent>
          </Conversation>
        </div>

        {/* Bottom Chat Input */}
        <div className="p-4 bg-sidebar">
           <div className="relative">
              <div className="bg-muted/50 rounded-2xl p-4 border border-border shadow-2xl transition-all focus-within:border-primary/50">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleCustomSubmit(e);
                    }
                  }}
                  placeholder="Describe your design"
                  className="w-full bg-transparent outline-none resize-none text-[14px] text-foreground placeholder:text-muted-foreground min-h-[40px] max-h-[200px]"
                />

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/50">
                  <div className="flex items-center gap-1.5">
                    <Button onClick={() => fileInputRef.current?.click()} variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800">
                      <Plus className="h-5 w-5" />
                    </Button>
                    <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                       onClick={handleCustomSubmit}
                       disabled={(!input.trim() && attachments.length === 0) || status === 'streaming'}
                       className="h-8 w-8 rounded-lg p-0 bg-white hover:bg-zinc-200 text-black shadow-lg"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
           </div>
           <p className="text-[10px] text-center mt-3 text-zinc-600 font-medium">
              Stitch can make mistakes. Please check its work.
           </p>
        </div>
      </aside>

      {/* Main Preview Area */}
      <main 
        ref={previewRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={(e) => {
          if (e.target === e.currentTarget) setIsFrameSelected(false);
        }}
        className={cn(
          "flex-1 flex flex-col bg-muted relative overflow-hidden",
          activeTool === 'hand' ? "cursor-grab active:cursor-grabbing" : "cursor-default"
        )}
      >
         {/* Grid Background */}
         <div 
           className="absolute inset-0 pointer-events-none opacity-[0.03]"
           style={{
             backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
             backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
             transform: `translate(${canvasOffset.x % (20 * zoom)}px, ${canvasOffset.y % (20 * zoom)}px)`
           }}
         />

         {/* Preview Header */}
         <header className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-30 pointer-events-none">
            <div className="flex items-center gap-2 pointer-events-auto">
               <div className="bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-full border shadow-sm flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
                  <span className="flex items-center gap-1">
                    {Math.round(zoom * 100)}%
                  </span>
               </div>
            </div>
            
            <div className="flex items-center gap-4 pointer-events-auto">
               <button className="flex items-center h-9 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[13px] font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all gap-2">
                 <Share2 className="h-4 w-4" />
                 Share
               </button>
               <UserMenu />
            </div>
         </header>

         {/* Content Layer */}
         <div 
           className="absolute inset-0 flex items-center justify-center transition-transform duration-75 ease-out select-none"
           style={{
             transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom})`
           }}
         >
            {currentArtifact ? (
                 <div 
                   onMouseDown={(e) => {
                     setIsFrameSelected(true);
                     startDraggingFrame(e);
                   }}
                   className={cn(
                     "group relative flex flex-col items-center select-none",
                     activeTool === 'select' ? "cursor-move" : "pointer-events-auto"
                   )}
                   style={{
                     transform: `translate(${framePos.x}px, ${framePos.y}px)`,
                     transition: 'transform 0s'
                   }}
                 >
                   {/* Top Frame Toolbar (Unified) */}
                   {(isFrameSelected || isPanning || isDraggingFrame || throttledArtifact?.isComplete) && (
                     <div className={cn(
                       "absolute -top-14 left-0 right-0 flex items-center justify-between px-2 py-2 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl z-[70] animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-auto transition-opacity",
                       !isFrameSelected && !isPanning && !isDraggingFrame && "opacity-0 group-hover:opacity-100"
                     )} onMouseDown={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                           <Button 
                             variant="ghost" 
                             size="sm" 
                             className="h-9 px-3 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl flex items-center gap-2 text-[10px] font-bold"
                             onClick={copyCode}
                           >
                             <Code className="h-3.5 w-3.5" />
                             CODE
                           </Button>
                           <Button 
                             variant="ghost" 
                             size="sm" 
                             className="h-9 px-3 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl flex items-center gap-2 text-[10px] font-bold"
                             onClick={exportAsHTML}
                           >
                             <Download className="h-3.5 w-3.5" />
                             EXPORT
                           </Button>
                           <Button 
                             variant="ghost" 
                             size="sm" 
                             className="h-9 w-9 p-0 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl"
                             onClick={openInNewTab}
                             title="Open in new tab"
                           >
                             <ExternalLink className="h-3.5 w-3.5" />
                           </Button>
                           <div className="w-[1px] h-4 bg-white/10 mx-1" />
                           <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl">
                              <ImageIcon className="h-4 w-4" />
                           </Button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2">{currentArtifact.type}</span>
                           <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-9 w-9 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
                              onClick={() => {
                                setCurrentArtifact(null);
                                setThrottledArtifact(null);
                                setIsFrameSelected(false);
                              }}
                           >
                              <Trash2 className="h-4 w-4" />
                           </Button>
                        </div>
                     </div>
                   )}

                   <div 
                    className={cn(
                      "transition-shadow duration-300 ease-in-out shadow-[0_40px_100px_rgba(0,0,0,0.4)] overflow-hidden border border-border/50 relative bg-white",
                      isFrameSelected && "ring-2 ring-primary border-primary",
                      isDraggingFrame && "shadow-[0_60px_120px_rgba(0,0,0,0.5)] border-primary",
                       currentArtifact.type === 'app' 
                         ? "w-[380px] rounded-2xl" 
                         : currentArtifact.type === 'web'
                           ? "w-[1024px] rounded-lg"
                           : "w-[800px] rounded-xl"
                     )}
                     style={{
                       height: `${dynamicFrameHeight}px`,
                       minHeight: currentArtifact.type === 'app' ? '800px' : undefined,
                       aspectRatio: currentArtifact.type === 'app' && !dynamicFrameHeight ? '9/19' : undefined,
                       transition: 'height 0.3s ease-in-out'
                     }}
                   >
                   {currentArtifact && !currentArtifact.isComplete && (
                     <div className="absolute inset-0 z-50 bg-zinc-50 pointer-events-none overflow-hidden flex items-center justify-center">
                        <div className="absolute inset-0 bg-white">
                           {/* Enhanced Shimmer Sweep */}
                           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-200/50 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
                        </div>
                        
                        <div className="relative z-10 flex flex-col items-center gap-4">
                           <div className="relative size-12">
                              <div className="absolute inset-0 border-2 border-primary/20 rounded-full" />
                              <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                           </div>
                           <span className="text-[12px] font-bold text-zinc-400 uppercase tracking-[0.2em] animate-pulse">
                              Crafting Design...
                           </span>
                        </div>
                     </div>
                   )}
                  
                   {throttledArtifact && throttledArtifact.isComplete && (
                       <iframe 
                        ref={iframeRef}
                        srcDoc={memoizedInjectedHTML}
                        className={cn(
                          "w-full h-full border-none bg-white transition-opacity duration-500",
                          isDraggingFrame || activeTool === 'hand' ? "pointer-events-none" : "pointer-events-auto"
                        )}
                        title="Design Preview"
                        sandbox="allow-scripts"
                      />
                   )}
                   </div>
                 </div>
              ) : (
               <div className="flex flex-col items-center gap-6 opacity-20 pointer-events-none">
                  <Logo iconSize={80} showText={false} />
                  <p className="text-xl font-medium tracking-tight">Generate your first design to see it here</p>
               </div>
            )}
         </div>

         {/* Bottom Floating Toolbar */}
         <div className="absolute bottom-8 left-1/2 -translate-x-1/2 p-1.5 bg-card/90 backdrop-blur-xl rounded-2xl border border-border shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-1 z-30">
            <Button 
              onClick={() => setActiveTool('select')}
              variant="ghost" 
              size="icon" 
              className={cn(
                "h-10 w-10 rounded-xl transition-all",
                activeTool === 'select' ? "bg-primary text-background shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
               <MousePointer2 className="h-5 w-5" />
            </Button>
            <Button 
              onClick={() => setActiveTool('hand')}
              variant="ghost" 
              size="icon" 
              className={cn(
                "h-10 w-10 rounded-xl transition-all",
                activeTool === 'hand' ? "bg-primary text-background shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
               <Hand className="h-5 w-5" />
            </Button>
            <div className="w-[1px] h-6 bg-border mx-1" />
            <Button 
              onClick={() => setZoom(prev => Math.min(prev * 1.2, 5))}
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
              title="Zoom In (Ctrl +)"
            >
               <ZoomIn className="h-5 w-5" />
            </Button>
            <Button 
              onClick={() => setZoom(prev => Math.max(prev / 1.2, 0.1))}
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
              title="Zoom Out (Ctrl -)"
            >
               <ZoomOut className="h-5 w-5" />
            </Button>
            <Button 
              onClick={() => {
                setCanvasOffset({ x: 0, y: 0 });
                setFramePos({ x: 0, y: 0 });
                setZoom(1);
              }}
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
              title="Reset View"
            >
               <RotateCcw className="h-5 w-5" />
            </Button>
         </div>
      </main>
    </div>
  );
}
