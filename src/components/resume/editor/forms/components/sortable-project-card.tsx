'use client';

import React, { useCallback } from 'react';
import { Project, DescriptionPoint } from "@/lib/types"; // Changed WorkExperience to Project
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  SensorDescriptor,
  SensorOptions,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Editor } from '@tiptap/react';

import { SortableDescriptionItem } from "./sortable-description-item";
import { AIGenerationSettingsTooltip } from "../../components/ai-generation-tooltip";
import { AISuggestions as AISuggestionsDisplay } from "../../../shared/ai-suggestions";

// Local type definitions (similar to experience card, might be generalized later)
export interface AISuggestion { id: string; point: string; }
export interface ImprovedPoint { original: DescriptionPoint; improved: string; }
export interface CardAIConfig { numPoints: number; customPrompt: string; }
export interface FocusRequestForPoint { descriptionId: string; }


export interface SortableProjectCardProps { // Renamed from SortableExperienceCardProps
  project: Project; // Changed from experience to project
  descriptionSensors: SensorDescriptor<SensorOptions>[];
  
  aiSuggestions: AISuggestion[];
  isLoadingAI: boolean;
  loadingPointAI: { [pointId: string]: boolean };
  aiConfig: CardAIConfig;
  improvedPoints: { [pointId: string]: ImprovedPoint };
  pointImprovementPrompts: { [pointId: string]: string };

  onProjectChange: (projectId: string, field: keyof Project, value: string | string[] | DescriptionPoint[] | undefined) => void; // Renamed, adjusted value type for optional fields
  onDescriptionChange: (projectId: string, descriptionId: string, newContent: string) => void;
  onDescriptionDelete: (projectId: string, descriptionId: string) => void;
  onDescriptionAdd: (projectId: string) => void;
  onDescriptionOrderChange: (projectId: string, newDescriptionOrder: DescriptionPoint[]) => void;
  
  onRemoveProject: (projectId: string) => void; // Renamed
  
  onGenerateAIPoints: (projectId: string, config: CardAIConfig) => void;
  onApproveAISuggestion: (projectId: string, suggestion: AISuggestion) => void;
  onDeleteAISuggestion: (projectId: string, suggestionId: string) => void;
  
  onRewritePoint: (projectId: string, pointId: string, customPrompt?: string) => void;
  onUndoImprovement: (projectId: string, pointId: string) => void;
  onAcceptImprovement: (projectId: string, pointId: string) => void;

  onSetAICfg: (projectId: string, cfg: CardAIConfig) => void;
  onSetImprovedPoint: (projectId: string, pointId: string, impPoint: ImprovedPoint | null) => void;
  onSetPointImprovementPrompt: (projectId: string, pointId: string, prompt: string) => void;

  onTiptapInstanceReady: (projectId: string, descriptionId: string, editor: Editor | null) => void;
}

export function SortableProjectCardItem({ // Renamed from SortableExperienceCardItem
  project: proj, // Changed from exp to proj
  descriptionSensors,
  aiSuggestions, isLoadingAI, loadingPointAI, aiConfig, improvedPoints, pointImprovementPrompts,
  onProjectChange, onDescriptionChange, onDescriptionDelete, onDescriptionAdd, onDescriptionOrderChange,
  onRemoveProject,
  onGenerateAIPoints, onApproveAISuggestion, onDeleteAISuggestion,
  onRewritePoint, onUndoImprovement, onAcceptImprovement,
  onSetAICfg,
  onSetImprovedPoint,
  onSetPointImprovementPrompt,
  onTiptapInstanceReady,
}: SortableProjectCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: proj.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : undefined,
  };

  const handleDescriptionDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const activeDescId = active.id.toString();
      const overDescId = over.id.toString();
      
      const oldIndex = proj.description.findIndex(dp => dp.id === activeDescId);
      const newIndex = proj.description.findIndex(dp => dp.id === overDescId);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newDescriptionOrder = arrayMove(proj.description, oldIndex, newIndex);
        onDescriptionOrderChange(proj.id, newDescriptionOrder);
      }
    }
  }, [proj.id, proj.description, onDescriptionOrderChange]);

  return (
    <div ref={setNodeRef} style={style} className="mb-4">
      <Card
        className={cn(
          "relative group transition-all duration-300",
          "bg-gradient-to-r from-violet-500/5 via-violet-500/10 to-purple-500/5", // Adjusted colors for projects
          "backdrop-blur-md border-2 border-violet-500/30", // Adjusted colors
          "shadow-sm",
          isDragging && "shadow-2xl opacity-90"
        )}
      >
        <button
          {...attributes}
          {...listeners}
          type="button"
          className="absolute -left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300 p-1.5 bg-violet-100/80 rounded-lg cursor-grab shadow-sm hover:bg-violet-200/80 z-10" // Adjusted colors
          aria-label="Drag to reorder project"
        >
          <GripVertical className="h-5 w-5 text-violet-700" /> {/* Adjusted colors */}
        </button>
        
        <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="relative flex-1">
                <Input
                  value={proj.name} // Changed from position
                  onChange={(e) => onProjectChange(proj.id, 'name', e.target.value)}
                  className={cn(
                    "text-sm font-semibold tracking-tight h-9",
                    "bg-white/50 border-gray-200 rounded-lg",
                    "focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/20", // Adjusted colors
                    "hover:border-violet-500/30 hover:bg-white/60 transition-colors", // Adjusted colors
                    "placeholder:text-gray-400"
                  )}
                  placeholder="Project Name" // Changed placeholder
                />
                <div className="absolute -top-2 left-2 px-1 bg-white/80 text-[7px] sm:text-[9px] font-medium text-gray-500">
                  PROJECT NAME
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemoveProject(proj.id)} // Changed callback
                className="text-gray-400 hover:text-red-500 transition-colors duration-300"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Project specific fields: URL, GitHub URL, Technologies */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <div className="relative">
                <Input
                  value={proj.url || ''}
                  onChange={(e) => onProjectChange(proj.id, 'url', e.target.value)}
                  className={cn(
                    "text-sm font-medium bg-white/50 border-gray-200 rounded-lg h-9",
                    "focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/20",
                    "hover:border-violet-500/30 hover:bg-white/60 transition-colors",
                    "placeholder:text-gray-400"
                  )}
                  placeholder="Project URL (Optional)"
                />
                <div className="absolute -top-2 left-2 px-1 bg-white/80 text-[7px] sm:text-[9px] font-medium text-gray-500">
                  URL
                </div>
              </div>
              <div className="relative">
                <Input
                  value={proj.github_url || ''}
                  onChange={(e) => onProjectChange(proj.id, 'github_url', e.target.value)}
                  className={cn(
                    "bg-white/50 border-gray-200 rounded-lg h-9",
                    "focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/20",
                    "hover:border-violet-500/30 hover:bg-white/60 transition-colors",
                    "placeholder:text-gray-400"
                  )}
                  placeholder="GitHub URL (Optional)"
                />
                <div className="absolute -top-2 left-2 px-1 bg-white/80 text-[7px] sm:text-[9px] font-medium text-gray-500">
                  GITHUB
                </div>
              </div>
            </div>
             <div className="relative group">
              <Input
                type="text"
                  value={proj.date || ''}
                  onChange={(e) => onProjectChange(proj.id, 'date', e.target.value)}
                  className={cn(
                    "w-full bg-white/50 border-gray-200 rounded-lg h-9",
                    "focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/20", // Adjusted colors
                    "hover:border-violet-500/30 hover:bg-white/60 transition-colors" // Adjusted colors
                  )}
                  placeholder="e.g., 'Jan 2023 - Mar 2023' or '2022'"
                />
                <div className="absolute -top-2 left-2 px-1 bg-white/80 text-[7px] sm:text-[9px] font-medium text-gray-500">
                  DATE
                </div>
              </div>
            <div className="relative">
                <Input
                  value={(proj.technologies || []).join(', ')}
                  onChange={(e) => onProjectChange(proj.id, 'technologies', e.target.value.split(',').map(t => t.trim()).filter(t => t))}
                  className={cn(
                    "bg-white/50 border-gray-200 rounded-lg h-9",
                    "focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/20",
                    "hover:border-violet-500/30 hover:bg-white/60 transition-colors",
                    "placeholder:text-gray-400"
                  )}
                  placeholder="Technologies Used (comma-separated)"
                />
                <div className="absolute -top-2 left-2 px-1 bg-white/80 text-[7px] sm:text-[9px] font-medium text-gray-500">
                  TECHNOLOGIES
                </div>
              </div>

            <div className="space-y-3">
              <Label className="text-[11px] md:text-xs font-medium text-gray-600">
                Project Description & Key Features
              </Label>
              <div className="space-y-2 pl-0">
                <DndContext
                  sensors={descriptionSensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDescriptionDragEnd}
                >
                  <SortableContext
                    items={proj.description.map(d => d.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {proj.description.map((descPoint) => (
                      <SortableDescriptionItem
                        key={descPoint.id}
                        id={descPoint.id}
                        desc={descPoint}
                        onChange={(newContent: string) => {
                          onDescriptionChange(proj.id, descPoint.id, newContent);
                          if (improvedPoints[descPoint.id]) {
                            onSetImprovedPoint(proj.id, descPoint.id, null);
                          }
                        }}
                        onDelete={() => onDescriptionDelete(proj.id, descPoint.id)}
                        onRewrite={() => onRewritePoint(proj.id, descPoint.id, pointImprovementPrompts[descPoint.id])}
                        isLoading={loadingPointAI[descPoint.id]}
                        isImproved={!!improvedPoints[descPoint.id]}
                        onAcceptImprovement={() => onAcceptImprovement(proj.id, descPoint.id)}
                        onUndoImprovement={() => onUndoImprovement(proj.id, descPoint.id)}
                        improvementPromptValue={pointImprovementPrompts[descPoint.id] || ''}
                        onImprovementPromptChange={(value: string) => onSetPointImprovementPrompt(proj.id, descPoint.id, value)}
                        onEditorInstanceReady={(editorInstance: Editor | null) => {
                           onTiptapInstanceReady(proj.id, descPoint.id, editorInstance);
                        }}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
                
                <AISuggestionsDisplay
                  suggestions={aiSuggestions || []}
                  onApprove={(suggestion) => onApproveAISuggestion(proj.id, suggestion)}
                  onDelete={(suggestionId) => onDeleteAISuggestion(proj.id, suggestionId)}
                />

                {proj.description.length === 0 && (!aiSuggestions || aiSuggestions.length === 0) && (
                  <div className="text-[11px] md:text-xs text-gray-500 italic px-4 py-3 bg-gray-50/50 rounded-lg">
                    Add points to describe your project and its features
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDescriptionAdd(proj.id)}
                  className={cn(
                    "flex-1 text-violet-600 hover:text-violet-700 transition-colors text-[10px] sm:text-xs", // Adjusted colors
                    "border-violet-200 hover:border-violet-300 hover:bg-violet-50/50" // Adjusted colors
                  )}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Point
                </Button>

                <AIGenerationSettingsTooltip
                  loadingAI={isLoadingAI}
                  generateAIPoints={() => onGenerateAIPoints(proj.id, aiConfig)}
                  aiConfig={aiConfig}
                  onNumPointsChange={(value) => onSetAICfg(proj.id, { ...aiConfig, numPoints: value })}
                  onCustomPromptChange={(value) => onSetAICfg(proj.id, { ...aiConfig, customPrompt: value })}
                  colorClass={{ // Adjusted colors for projects
                    button: "text-indigo-600",
                    border: "border-indigo-200",
                    hoverBorder: "hover:border-indigo-300",
                    hoverBg: "hover:bg-indigo-50/50",
                    tooltipBg: "bg-indigo-50",
                    tooltipBorder: "border-2 border-indigo-300",
                    tooltipShadow: "shadow-lg shadow-indigo-100/50",
                    text: "text-indigo-600",
                    hoverText: "hover:text-indigo-700"
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
