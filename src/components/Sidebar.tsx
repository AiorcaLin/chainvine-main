"use client";

import { useState } from "react";

interface SidebarProps {
  items: Array<{
    icon: React.ReactNode;
    label: string;
  }>;
}

export function Sidebar({ items }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      <div 
        className={`fixed right-0 top-0 h-screen flex transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-[calc(100%-8px)]'
        }`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="h-20 w-2 flex items-center justify-center self-center -ml-2 rounded-l
            bg-secondary/80 backdrop-blur-sm hover:bg-card-hover transition-colors
            border border-r-0 border-border"
          title={isOpen ? "Hide Sidebar" : "Show Sidebar"}
        >
          <svg
            className={`w-4 h-4 text-accent transition-transform duration-300 ${
              isOpen ? 'rotate-0' : 'rotate-180'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={isOpen ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"}
            />
          </svg>
        </button>

        {/* Sidebar Content */}
        <div className="w-16 bg-secondary/80 backdrop-blur-xl h-screen flex flex-col items-center border-l border-border">
          <div className="flex-1 flex flex-col items-center justify-center gap-8 py-12">
            {items.map((item, index) => (
              <div
                key={index}
                className="p-2 hover:bg-accent/10 rounded-lg cursor-pointer group transition-colors"
                title={item.label}
              >
                {item.icon}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
} 