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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { UserMenu } from "@/components/user-menu";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DefaultChatTransport } from "ai";
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
  type: "app" | "web";
  messages: any[];
}

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [attachments, setAttachments] = useState<{ url: string; isUploading: boolean }[]>([]);
  const [input, setInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    onFinish: () => {
      // Logic after AI finishes
    },
  });

  useEffect(() => {
    const fetchProjectAndInitialize = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        if (!res.ok) throw new Error("Project not found");
        const data = await res.json();
        setProject(data);
        
        // Load initial messages from DB
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        }

        // Check if there's a pending prompt from the home page
        const pendingPromptRaw = sessionStorage.getItem(`pending_prompt_${projectId}`);
        if (pendingPromptRaw) {
          const { content, attachments: initialAttachments } = JSON.parse(pendingPromptRaw);
          sessionStorage.removeItem(`pending_prompt_${projectId}`);
          
          // Trigger the initial AI response
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

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && attachments.length === 0) return;
    
    sendMessage({
      text: input,
      files: attachments.map(a => ({ type: "file" as const, url: a.url, mediaType: "image/*" }))
    });
    
    setAttachments([]);
    setInput("");
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#09090b]">
        <div className="flex flex-col items-center gap-4">
           <Loader2 className="h-8 w-8 animate-spin text-primary" />
           <span className="text-zinc-500 text-sm font-medium">Entering Workspace...</span>
        </div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="flex h-screen w-full bg-[#09090b] text-foreground overflow-hidden font-sans">
      
      {/* Left Sidebar - Chat History */}
      <aside className="w-[450px] flex flex-col border-r border-[#1a1a1e] bg-[#09090b] z-20">
        <header className="flex items-center justify-between p-4 border-b border-[#1a1a1e] h-14 bg-[#09090b]">
           <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="h-8 w-8 rounded-lg hover:bg-[#1a1a1e]">
                <RotateCcw className="h-4 w-4 text-zinc-500" />
              </Button>
              <div className="flex flex-col">
                 <span className="font-bold text-sm truncate max-w-[220px] tracking-tight">{project.title}</span>
                 <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{project.type} Prototype</span>
              </div>
           </div>
           <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-zinc-500 hover:text-white hover:bg-[#1a1a1e]">
                 <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-zinc-500 hover:text-white hover:bg-[#1a1a1e]">
                 <MoreVertical className="h-4 w-4" />
              </Button>
           </div>
        </header>

        <div className="flex-1 relative overflow-hidden">
          <Conversation className="relative h-full">
            <ConversationContent className="p-6 gap-10 scrollbar-hide">
              {messages.length === 0 ? (
                <ConversationEmptyState
                  title="Initialize Workspace"
                  description="Describe your vision to generate the first high-fidelity prototype."
                  icon={<MessageSquareIcon className="size-6 text-primary" />}
                />
              ) : (
                messages.map((message) => (
                  <Message from={message.role} key={message.id} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex items-center gap-3 mb-4">
                       {message.role === 'user' ? (
                         <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-[#4f46e5] to-[#9333ea] flex items-center justify-center text-xs font-black shadow-lg shadow-purple-500/20">
                            U
                         </div>
                       ) : (
                         <div className="h-8 w-8 rounded-xl bg-[#1a1a1e] flex items-center justify-center border border-[#2a2a2e] shadow-xl">
                            <Logo iconSize={16} showText={false} showBadge={false} />
                         </div>
                       )}
                       <div className="flex flex-col">
                          <span className="text-[11px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">
                             {message.role === 'user' ? 'Designer' : 'Sketch AI'}
                          </span>
                          <span className="text-xs font-bold text-zinc-200">
                             {message.role === 'user' ? 'You' : 'Vision Engine'}
                          </span>
                       </div>
                       {message.role === 'assistant' && status === 'streaming' && (
                         <div className="ml-auto flex items-center gap-1.5 bg-[#1a1a1e] px-2.5 py-1 rounded-full border border-[#2a2a2e]">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-zinc-400">Streaming</span>
                         </div>
                       )}
                    </div>

                    <MessageContent className="pl-[44px] space-y-4">
                      {message.parts?.map((part: any, i: number) => {
                        if (part.type === 'text') {
                          const textContent = typeof part.text === 'string' ? part.text : part.text?.text;
                          if (!textContent) return null;
                          return (
                            <div key={i} className="text-[14px] text-zinc-300 leading-relaxed font-medium whitespace-pre-wrap">
                               {message.role === 'assistant' ? (
                                 <MessageResponse>{textContent}</MessageResponse>
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
                            <MessageAttachments key={i} className="mb-2">
                               <MessageAttachment data={{ type: "file", url: fileUrl, mediaType: "image/png" }} />
                            </MessageAttachments>
                          );
                        }
                        return null;
                      })}
                      
                      {/* Fallback for messages without parts */}
                      {!message.parts && (
                        <div className="text-[14px] text-zinc-300 leading-relaxed font-medium whitespace-pre-wrap">
                           {message.role === 'assistant' ? (
                             <MessageResponse>{(message as any).content}</MessageResponse>
                           ) : (
                             (message as any).content
                           )}
                        </div>
                      )}
                    </MessageContent>
                  </Message>
                ))
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        </div>

        {/* Bottom Chat Input */}
        <div className="p-6 border-t border-[#1a1a1e] bg-[#09090b]">
           <div className="relative group">
              {/* Image Previews */}
              <AnimatePresence>
                {attachments.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-wrap gap-2 mb-4">
                    {attachments.map((attr, i) => (
                      <div key={i} className="relative group/img h-16 w-16 rounded-xl overflow-hidden border border-[#2a2a2e] bg-[#0d0d0f]">
                        <img src={attr.url} alt="Upload" className={cn("h-full w-full object-cover", attr.isUploading && "opacity-40 blur-sm")} />
                        {attr.isUploading && <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="h-4 w-4 text-white animate-spin" /></div>}
                        <button onClick={() => removeAttachment(i)} className="absolute top-1 right-1 h-4 w-4 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover/img:opacity-100 transition-opacity"><X className="h-2 w-2" /></button>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className={cn(
                "relative bg-[#0d0d0f] rounded-[24px] p-5 space-y-4 border transition-all duration-300 shadow-2xl",
                project.type === 'app' ? "focus-within:border-purple-500/30" : "focus-within:border-blue-500/30"
              )}>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleCustomSubmit(e);
                    }
                  }}
                  placeholder="Ask Sketch to iterate..."
                  className="w-full h-24 bg-transparent outline-none resize-none text-sm text-foreground placeholder:text-zinc-600 font-medium hide-scrollbar"
                />

                <div className="flex items-center justify-between pt-2 border-t border-[#1a1a1e]">
                  <div className="flex items-center gap-3">
                    <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                    <Button onClick={() => fileInputRef.current?.click()} variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-[#1a1a1e] text-zinc-500 hover:text-white border border-[#2a2a2e]">
                      <Plus className="h-4.5 w-4.5" />
                    </Button>
                    <div className="hidden sm:flex items-center gap-2 bg-[#1a1a1e] px-3 py-1.5 rounded-xl border border-[#2a2a2e]">
                       <Sparkles className="h-3 w-3 text-purple-400" />
                       <span className="text-[10px] font-black text-zinc-500 uppercase tracking-tight">Vision Pro</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                       onClick={handleCustomSubmit}
                       disabled={(!input.trim() && attachments.length === 0) || status === 'streaming' || attachments.some(a => a.isUploading)}
                       className={cn(
                         "h-9 w-9 rounded-xl p-0 shadow-lg transition-all",
                         project.type === 'app' ? "bg-purple-600 hover:bg-purple-500" : "bg-blue-600 hover:bg-blue-500"
                       )}
                    >
                      {status === 'streaming' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4.5 w-4.5" />}
                    </Button>
                  </div>
                </div>
              </div>
           </div>
           <p className="text-[10px] text-center mt-4 text-zinc-600 font-bold uppercase tracking-tighter opacity-50">
              Generated design powered by Gemini 2.0 Flash
           </p>
        </div>
      </aside>

      {/* Main Preview Area */}
      <main className="flex-1 flex flex-col bg-[#0d0d0f] relative overflow-hidden">
         {/* Grid Background Effect */}
         <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 0)', backgroundSize: '40px 40px' }} />

         {/* Preview Header */}
         <header className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-8 z-10 pointer-events-none">
            <div className="flex items-center gap-4 pointer-events-auto">
               <div className="bg-[#1a1a1e]/80 backdrop-blur-xl border border-[#2a2a2e] rounded-2xl px-4 py-2 flex items-center gap-3 shadow-2xl">
                  {project.type === 'app' ? <Smartphone className="h-4 w-4 text-purple-400" /> : <Monitor className="h-4 w-4 text-blue-400" />}
                  <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Live Preview</span>
                  <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
               </div>
            </div>
            
            <div className="flex items-center gap-4 pointer-events-auto">
               <div className="flex items-center bg-[#1a1a1e]/80 backdrop-blur-xl rounded-2xl border border-[#2a2a2e] p-1.5 pr-4 gap-3 shadow-2xl">
                  <div className="h-8 w-8 rounded-xl bg-[#2a2a2e] flex items-center justify-center">
                     <Logo iconSize={16} showText={false} showBadge={false} />
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[11px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl hover:opacity-90 active:scale-95 transition-all">
                    <Share2 className="h-3.5 w-3.5" />
                    Share Design
                  </Button>
               </div>
               <UserMenu />
            </div>
         </header>

         {/* Canvas area (mockup) */}
         <div className="flex-1 p-12 pt-24 flex items-center justify-center relative">
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="w-full max-w-5xl h-full rounded-[32px] bg-[#f4f4f5] shadow-[0_60px_150px_-30px_rgba(0,0,0,0.7)] border border-white/5 overflow-hidden flex flex-col relative"
            >
               {/* Design Frame Header */}
               <div className="h-10 bg-white border-b border-zinc-100 flex items-center px-4 justify-between">
                  <div className="flex gap-1.5">
                     <div className="h-3 w-3 rounded-full bg-zinc-200" />
                     <div className="h-3 w-3 rounded-full bg-zinc-200" />
                     <div className="h-3 w-3 rounded-full bg-zinc-200" />
                  </div>
                  <div className="bg-zinc-100 px-3 py-1 rounded-md text-[10px] font-medium text-zinc-400">
                     design-preview-v1.sketch
                  </div>
                  <div className="w-12" />
               </div>

               <div className="flex-1 flex items-center justify-center bg-zinc-50">
                  <div className="flex flex-col items-center gap-6 opacity-20">
                     <Layout className="h-20 w-20 text-zinc-900" />
                     <p className="text-sm font-bold text-zinc-900 uppercase tracking-widest">Rendering Workspace</p>
                  </div>
               </div>
            </motion.div>
         </div>

         {/* Bottom Floating Toolbar */}
         <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-[#1a1a1e]/90 backdrop-blur-2xl rounded-[24px] border border-[#2a2a2e] shadow-[0_40px_100px_rgba(0,0,0,0.8)] z-50">
            <div className="flex items-center px-4 gap-2 border-r border-[#2a2a2e] mr-2 text-xs font-black text-zinc-400">
               100%
            </div>
            <div className="flex gap-1">
               {[
                 { icon: MousePointer2, color: 'text-purple-400' },
                 { icon: SearchIcon, color: 'text-zinc-500' },
                 { icon: Layout, color: 'text-zinc-500' },
                 { icon: Download, color: 'text-zinc-500' },
                 { icon: RotateCcw, color: 'text-zinc-500' }
               ].map((tool, i) => (
                  <Button key={i} variant="ghost" size="icon" className={cn("h-11 w-11 rounded-2xl hover:bg-[#2a2a2e] transition-all", tool.color)}>
                     <tool.icon className="h-5 w-5" />
                  </Button>
               ))}
            </div>
         </div>

         {/* Utility buttons corner */}
         <div className="absolute bottom-10 left-10 flex flex-col gap-3">
            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-[#1a1a1e] border border-[#2a2a2e] shadow-2xl text-zinc-500 hover:text-white">
               <Globe className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-[#1a1a1e] border border-[#2a2a2e] shadow-2xl text-zinc-500 hover:text-white">
               <Maximize2 className="h-5 w-5" />
            </Button>
         </div>
      </main>
    </div>
  );
}
