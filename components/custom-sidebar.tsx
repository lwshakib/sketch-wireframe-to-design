"use client";

import React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

import { useRouter } from "next/navigation";
import { Smartphone } from "lucide-react";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

const ProjectSkeleton = () => (
  <div className="space-y-4">
    <div className="h-3 w-20 bg-secondary animate-pulse rounded ml-2" />
    <div className="space-y-2">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-3 p-2">
           <div className="h-9 w-9 bg-secondary animate-pulse rounded-lg" />
           <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-full bg-secondary animate-pulse rounded" />
              <div className="h-2.5 w-1/2 bg-secondary animate-pulse rounded" />
           </div>
        </div>
      ))}
    </div>
  </div>
);

interface SidebarProps {
  sections: any[];
  loading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export function Sidebar({ 
  sections, 
  loading, 
  isLoadingMore,
  hasMore,
  loadMore,
  searchQuery, 
  setSearchQuery 
}: SidebarProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      if (!hasMore || isLoadingMore || searchQuery) return;
      
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (scrollTop + clientHeight >= scrollHeight - 50) {
        loadMore();
      }
    };

    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [hasMore, isLoadingMore, loadMore, searchQuery]);

  return (
    <aside className="w-[300px] h-screen bg-sidebar border-r border-sidebar-border hidden lg:flex flex-col transition-colors duration-300">
      {/* Search Header */}
      <div className="p-4 pt-6">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects"
            className="w-full bg-secondary/50 border border-border rounded-lg py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-border transition-all font-medium"
          />
        </div>
      </div>

      {/* Navigation */}
      <div 
        ref={scrollRef}
        className="flex-1 px-4 space-y-8 pb-8 mt-4 overflow-y-auto scrollbar-hide"
      >
        {loading ? (
          <div className="space-y-8">
            <ProjectSkeleton />
            <ProjectSkeleton />
          </div>
        ) : sections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
             <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                <Search className="h-5 w-5 text-muted-foreground" />
             </div>
             <p className="text-xs font-medium text-muted-foreground px-4">No projects found</p>
          </div>
        ) : (
          <>
            {sections.map((section) => (
              <div key={section.title} className="space-y-4">
                <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item: any) => (
                    <button
                      key={item.id}
                      onClick={() => router.push(`/project/${item.id}`)}
                      className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-secondary transition-all text-left group"
                    >
                      <div className={cn("h-10 w-10 shrink-0 rounded-lg flex items-center justify-center border border-border shadow-sm bg-indigo-500/10 text-indigo-500")}>
                         <Smartphone className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-semibold text-foreground truncate transition-colors">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tight">
                          Project
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            
            {isLoadingMore && (
              <div className="flex justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
