'use client';

import React from 'react';
import { DescriptionPoint } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { GripVertical, Check, X, Loader2, Sparkles, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Tiptap from "@/components/ui/tiptap";
import { Editor } from '@tiptap/react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { AIImprovementPrompt } from "../../../shared/ai-improvement-prompt";

export interface SortableDescriptionItemProps {
  id: string;
  desc: DescriptionPoint;
  onChange: (newContent: string) => void;
  onDelete: () => void;
  onRewrite: () => void;
  isLoading: boolean | undefined;
  isImproved: boolean;
  onAcceptImprovement: () => void;
  onUndoImprovement: () => void;
  improvementPromptValue: string;
  onImprovementPromptChange: (value: string) => void;
  onEditorInstanceReady?: (editor: Editor | null) => void;
}

export function SortableDescriptionItem({
  id,
  desc,
  onChange,
  onDelete,
  onRewrite,
  isLoading,
  isImproved,
  onAcceptImprovement,
  onUndoImprovement,
  improvementPromptValue,
  onImprovementPromptChange,
  onEditorInstanceReady
}: SortableDescriptionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex gap-1 items-start group/item mb-2"
    >
      <button
        {...attributes}
        {...listeners}
        className="p-1 cursor-grab mt-2 opacity-50 group-hover/item:opacity-100"
        type="button"
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </button>
      <div className="flex-1">
        <Tiptap
          content={desc.content}
          onChange={onChange}
          onEditorInstanceReady={onEditorInstanceReady}
          className={cn(
            "min-h-[60px] text-xs md:text-sm bg-white/50 border-gray-200 rounded-lg",
            "focus:border-cyan-500/40 focus:ring-2 focus:ring-cyan-500/20",
            "hover:border-cyan-500/30 hover:bg-white/60 transition-colors",
            "placeholder:text-gray-400",
            isImproved && [
              "border-purple-400",
              "bg-gradient-to-r from-purple-50/80 to-indigo-50/80",
              "shadow-[0_0_15px_-3px_rgba(168,85,247,0.2)]",
              "hover:bg-gradient-to-r hover:from-purple-50/90 hover:to-indigo-50/90"
            ]
          )}
        />

        {isImproved && (
          <div className="absolute -top-2.5 right-12 px-2 py-0.5 bg-purple-100 rounded-full">
            <span className="text-[10px] font-medium text-purple-600 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              AI Suggestion
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1">
        {isImproved ? (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={onAcceptImprovement}
              className={cn(
                "p-0 group-hover/item:opacity-100",
                "h-8 w-8 rounded-lg",
                "bg-green-50/80 hover:bg-green-100/80",
                "text-green-600 hover:text-green-700",
                "border border-green-200/60",
                "shadow-sm",
                "transition-all duration-300",
                "hover:scale-105 hover:shadow-md",
                "hover:-translate-y-0.5"
              )}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onUndoImprovement}
              className={cn(
                "p-0 group-hover/item:opacity-100",
                "h-8 w-8 rounded-lg",
                "bg-rose-50/80 hover:bg-rose-100/80",
                "text-rose-600 hover:text-rose-700",
                "border border-rose-200/60",
                "shadow-sm",
                "transition-all duration-300",
                "hover:scale-105 hover:shadow-md",
                "hover:-translate-y-0.5"
              )}
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="p-0 group-hover/item:opacity-100 text-gray-400 hover:text-red-500 transition-all duration-300"
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onRewrite}
                    disabled={isLoading}
                    className={cn(
                      "p-0 group-hover/item:opacity-100",
                      "h-8 w-8 rounded-lg",
                      "bg-purple-50/80 hover:bg-purple-100/80",
                      "text-purple-600 hover:text-purple-700",
                      "border border-purple-200/60",
                      "shadow-sm",
                      "transition-all duration-300",
                      "hover:scale-105 hover:shadow-md",
                      "hover:-translate-y-0.5"
                    )}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  align="start"
                  sideOffset={2}
                  className={cn(
                    "w-72 p-3.5",
                    "bg-purple-50",
                    "border-2 border-purple-300",
                    "shadow-lg shadow-purple-100/50",
                    "rounded-lg"
                  )}
                >
                  <AIImprovementPrompt
                    value={improvementPromptValue}
                    onChange={onImprovementPromptChange}
                    onSubmit={onRewrite}
                    isLoading={isLoading}
                  />
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        )}
      </div>
    </div>
  );
}
