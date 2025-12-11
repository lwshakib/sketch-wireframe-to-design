"use client";

import React, { useState } from "react";

type ColorItem = {
  name: string;
  hex: string;
  description: string;
  swatchClass?: string;
};

type ColorGroup = {
  title: string;
  columns?: string;
  items: ColorItem[];
};

const colorGroups: ColorGroup[] = [
  {
    title: "Primary Colours",
    columns: "sm:grid-cols-2 lg:grid-cols-4",
    items: [
      {
        name: "Background",
        hex: "#171717",
        description: "Clean visible background for main content areas",
        swatchClass: "bg-[#171717] border border-white/10",
      },
      {
        name: "Foreground",
        hex: "#FAFAFA",
        description: "Primary text color with high contrast",
        swatchClass: "bg-[#FAFAFA] border border-white/20",
      },
      {
        name: "Card",
        hex: "#1F1F1F",
        description: "Elevated surface color for product cards",
        swatchClass: "bg-[#1F1F1F] border border-white/10",
      },
      {
        name: "Card Foreground",
        hex: "#0B0B0B",
        description: "Text color on card surfaces",
        swatchClass: "bg-[#0B0B0B] border border-white/20",
      },
    ],
  },
  {
    title: "Secondary & Accent Colors",
    columns: "sm:grid-cols-2 lg:grid-cols-4",
    items: [
      {
        name: "Primary",
        hex: "#B65631",
        description: "Warm brown for CTAs and brand elements",
        swatchClass: "bg-[#B65631]",
      },
      {
        name: "Primary Foreground",
        hex: "#F6E7DA",
        description: "Text on primary colored elements",
        swatchClass: "bg-[#F6E7DA] border border-white/30",
      },
      {
        name: "Secondary",
        hex: "#372521",
        description: "Subtle warm background for secondary actions",
        swatchClass: "bg-[#372521]",
      },
      {
        name: "Secondary Foreground",
        hex: "#B6A8A4",
        description: "Text on secondary elements",
        swatchClass: "bg-[#B6A8A4] border border-white/30",
      },
    ],
  },
  {
    title: "UI Component Colors",
    columns: "sm:grid-cols-2 lg:grid-cols-3",
    items: [
      {
        name: "Muted",
        hex: "#1F1F1F",
        description: "Subtle backgrounds and disabled states",
        swatchClass: "bg-[#1F1F1F] border border-white/10",
      },
      {
        name: "Muted Foreground",
        hex: "#B7B7B3",
        description: "Secondary text and captions",
        swatchClass: "bg-[#B7B7B3] border border-white/30",
      },
      {
        name: "Accent",
        hex: "#8D6A4B",
        description: "Warm accent for highlights and links",
        swatchClass: "bg-[#8D6A4B]",
      },
      {
        name: "Accent Foreground",
        hex: "#F4E1AA",
        description: "Text on accent colored elements",
        swatchClass: "bg-[#F4E1AA] border border-white/30",
      },
      {
        name: "Popover",
        hex: "#0F0F0F",
        description: "Card & dropdown backgrounds",
        swatchClass: "bg-[#0F0F0F] border border-white/20",
      },
      {
        name: "Popover Foreground",
        hex: "#A1A1A1",
        description: "Text in modals and dropdowns",
        swatchClass: "bg-[#A1A1A1] border border-white/30",
      },
    ],
  },
  {
    title: "Utility & Form Colors",
    columns: "sm:grid-cols-2 lg:grid-cols-3",
    items: [
      {
        name: "Border",
        hex: "#2C2C2C",
        description: "Subtle borders and dividers",
        swatchClass: "bg-[#2C2C2C]",
      },
      {
        name: "Input",
        hex: "#1E1E1E",
        description: "Form field backgrounds",
        swatchClass: "bg-[#1E1E1E] border border-white/10",
      },
      {
        name: "Ring",
        hex: "#B65631",
        description: "Focus indicators matching primary",
        swatchClass: "bg-[#B65631]",
      },
    ],
  },
  {
    title: "Status & Feedback Colors",
    columns: "sm:grid-cols-2 lg:grid-cols-3",
    items: [
      {
        name: "Destructive",
        hex: "#DB4640",
        description: "Error states and destructive actions",
        swatchClass: "bg-[#DB4640]",
      },
      {
        name: "Destructive Foreground",
        hex: "#FFE9E9",
        description: "Text on destructive elements",
        swatchClass: "bg-[#FFE9E9] border border-white/30",
      },
    ],
  },
];

const ColorsTab = () => {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const handleCopy = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopiedHex(hex);
      setTimeout(() => setCopiedHex(null), 1000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="text-white/80">
      <div className="grid gap-12">
        {colorGroups.map((group) => (
          <section key={group.title} className="space-y-4">
            <h3 className="text-xs uppercase tracking-[0.15em] text-white/40 font-medium">
              {group.title}
            </h3>
            <div
              className={`grid gap-4 ${
                group.columns || "sm:grid-cols-2 lg:grid-cols-3"
              }`}
            >
              {group.items.map((item) => (
                <div
                  key={item.name}
                  onClick={() => handleCopy(item.hex)}
                  className="flex items-center gap-4 px-1 py-1 cursor-pointer group"
                >
                  <div
                    className={`h-12 w-12 rounded-lg shadow-inner shrink-0 ${item.swatchClass}`}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-white truncate">
                      {item.name}
                    </span>
                    <span
                      className={`text-[11px] font-mono transition-colors ${
                        copiedHex === item.hex
                          ? "text-[#B65631]"
                          : "text-white/50"
                      }`}
                    >
                      {copiedHex === item.hex ? "Copied!" : item.hex}
                    </span>
                    <span className="text-[11px] text-white/40 leading-tight mt-0.5">
                      {item.description}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default ColorsTab;
