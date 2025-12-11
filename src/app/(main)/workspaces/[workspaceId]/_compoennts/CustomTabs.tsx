"use client";

import React, { useState, ReactNode } from "react";

type TabItem = {
  value: string;
  label: ReactNode;
  content: ReactNode;
};

type CustomTabsProps = {
  value?: string;
  defaultValue?: string;
  items: TabItem[];
  className?: string;
  onTabChange?: (value: string) => void;
};

const CustomTabs = ({ value, defaultValue, items, className = "", onTabChange }: CustomTabsProps) => {
  const [internalTab, setInternalTab] = useState(defaultValue || items[0]?.value || "");
  const activeTab = value !== undefined ? value : internalTab;

  const handleTabChange = (newValue: string) => {
    if (value === undefined) {
      setInternalTab(newValue);
    }
    onTabChange?.(newValue);
  };

  return (
    <div className={className}>
      <div className="flex justify-end">
        <div className="flex bg-[#1b1b1b] text-white/80 px-2 py-1 rounded-full shadow-[0_0_0_1px_rgba(255,255,255,0.08)] h-10 gap-2">
          {items.map((item) => (
            <button
              key={item.value}
              onClick={() => handleTabChange(item.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition inline-flex items-center gap-2 ${
                activeTab === item.value
                  ? "bg-[#2a2a2a] text-white shadow"
                  : "text-white/80 hover:bg-white/5"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Export a hook to get the active content
export const useCustomTabs = (defaultValue?: string, items: TabItem[]) => {
  const [activeTab, setActiveTab] = useState(defaultValue || items[0]?.value || "");
  const activeContent = items.find((item) => item.value === activeTab)?.content;
  return { activeTab, setActiveTab, activeContent };
};

export default CustomTabs;

