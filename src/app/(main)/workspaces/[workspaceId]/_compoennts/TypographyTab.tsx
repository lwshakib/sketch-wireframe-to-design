"use client";

import React from "react";

type TypeItem = {
  name: string;
  description: string;
  sample: string;
  className: string;
};

type TypeGroup = {
  title: string;
  items: TypeItem[];
};

const typeGroups: TypeGroup[] = [
  {
    title: "Display & Headers",
    items: [
      {
        name: "Display Large",
        description: "Hero headlines and large display text",
        sample: "The quick brown fox jumps over the lazy dog",
        className: "text-3xl sm:text-4xl lg:text-5xl font-semibold",
      },
      {
        name: "Heading 1",
        description: "Primary section headers",
        sample: "The quick brown fox jumps over the lazy dog",
        className: "text-2xl sm:text-3xl font-semibold",
      },
      {
        name: "Heading 2",
        description: "Secondary headers and subsections",
        sample: "The quick brown fox jumps over the lazy dog",
        className: "text-xl sm:text-2xl font-semibold",
      },
    ],
  },
  {
    title: "Body & Content",
    items: [
      {
        name: "Body Large",
        description: "Large body text for emphasis",
        sample: "The quick brown fox jumps over the lazy dog",
        className: "text-base sm:text-lg font-medium",
      },
      {
        name: "Body Regular",
        description: "Standard body text and paragraphs",
        sample: "The quick brown fox jumps over the lazy dog",
        className: "text-sm sm:text-base font-normal",
      },
    ],
  },
];

const TypographyTab = () => {
  return (
    <div className="text-white/80 space-y-10">
      {typeGroups.map((group) => (
        <section key={group.title} className="space-y-4">
          <h3 className="text-xs uppercase tracking-[0.15em] text-white/40 font-medium">
            {group.title}
          </h3>
          <div className="space-y-6">
            {group.items.map((item) => (
              <div key={item.name} className="space-y-1">
                <div className="text-sm font-semibold text-white">
                  {item.name}
                </div>
                <div className="text-[11px] text-white/50">
                  {item.description}
                </div>
                <div className={`${item.className} text-white leading-snug`}>
                  {item.sample}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default TypographyTab;

