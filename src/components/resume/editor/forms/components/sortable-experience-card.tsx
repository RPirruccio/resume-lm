'use client';

import React, { useCallback } from 'react';
import { WorkExperience, DescriptionPoint } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  // useSensors, // Removed as it's not used directly here
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
// import { v4 as uuidv4 } from 'uuid'; // Not used in this file
import { Editor } from '@tiptap/react';

import { SortableDescriptionItem } from "./sortable-description-item";
import { AIGenerationSettingsTooltip } from "../../components/ai-generation-tooltip"; // Adjusted path
import { AISuggestions as AISuggestionsDisplay } from "../../../shared/ai-suggestions"; // Renamed to avoid conflict, adjusted path

// Local type definitions (consider moving to lib/types if widely used)
export interface AISuggestion { id: string; point: string; }
export interface ImprovedPoint { original: DescriptionPoint; improved: string; }
export interface CardAIConfig { numPoints: number; customPrompt: string; }
// ImprovementConfig for a single point's prompt (renamed from original ImprovementConfig structure)
// export interface PointImprovementConfig { prompt: string; } // This was for a single point, now it's a map
export interface FocusRequestForPoint { descriptionId: string; }


export interface SortableExperienceCardProps {
  experience: WorkExperience;
  descriptionSensors: SensorDescriptor<SensorOptions>[]; // Corrected type based on useSensors return
  
  // Data specific to this card
  aiSuggestions: AISuggestion[];
  isLoadingAI: boolean;
  loadingPointAI: { [pointId: string]: boolean };
  aiConfig: CardAIConfig;
  improvedPoints: { [pointId: string]: ImprovedPoint };
  pointImprovementPrompts: { [pointId: string]: string };

  // Callbacks for updating parent state
  onExperienceChange: (experienceId: string, field: keyof WorkExperience, value: string | string[] | DescriptionPoint[]) => void; // Typed 'value' more specifically
  onDescriptionChange: (experienceId: string, descriptionId: string, newContent: string) => void;
  onDescriptionDelete: (experienceId: string, descriptionId: string) => void;
  onDescriptionAdd: (experienceId: string) => void;
  onDescriptionOrderChange: (experienceId: string, newDescriptionOrder: DescriptionPoint[]) => void;
  
  onRemoveExperience: (experienceId: string) => void;
  
  onGenerateAIPoints: (experienceId: string, config: CardAIConfig) => void;
  onApproveAISuggestion: (experienceId: string, suggestion: AISuggestion) => void;
  onDeleteAISuggestion: (experienceId: string, suggestionId: string) => void;
  
  onRewritePoint: (experienceId: string, pointId: string, customPrompt?: string) => void;
  onUndoImprovement: (experienceId: string, pointId: string) => void;
  onAcceptImprovement: (experienceId: string, pointId: string) => void;

  onSetAISuggestions: (experienceId: string, suggestions: AISuggestion[]) => void; // Kept for now, might be removed if parent handles all AI state
  onSetIsLoadingAI: (experienceId: string, isLoading: boolean) => void; // Kept
  onSetLoadingPointAI: (experienceId: string, pointId: string, isLoading: boolean) => void; // Kept
  onSetAICfg: (experienceId: string, cfg: CardAIConfig) => void; // Kept
  onSetImprovedPoint: (experienceId: string, pointId: string, impPoint: ImprovedPoint | null) => void; // Kept
  onSetPointImprovementPrompt: (experienceId: string, pointId: string, prompt: string) => void; // Kept

  // tiptapRefs: React.MutableRefObject<{ [expKey: string]: { [descKey: string]: Editor | null } }>; // Parent will manage this
  onTiptapInstanceReady: (experienceId: string, descriptionId: string, editor: Editor | null) => void;

  // focusRequest: FocusRequestForPoint | null; // Parent will pass this down if needed for a specific point
  // onSetFocusRequest: (experienceId: string, request: FocusRequestForPoint | null) => void; // Removed as child doesn't initiate parent focus setting

  // onShowErrorDialog: (title: string, description: string) => void; // Parent will handle error dialogs
}

export function SortableExperienceCardItem({
  experience: exp,
  descriptionSensors,
  aiSuggestions, isLoadingAI, loadingPointAI, aiConfig, improvedPoints, pointImprovementPrompts,
  onExperienceChange, onDescriptionChange, onDescriptionDelete, onDescriptionAdd, onDescriptionOrderChange,
  onRemoveExperience,
  onGenerateAIPoints, onApproveAISuggestion, onDeleteAISuggestion,
  onRewritePoint, onUndoImprovement, onAcceptImprovement,
  // onSetAISuggestions, // Removed as parent will likely handle this directly
  // onSetIsLoadingAI, // Removed
  // onSetLoadingPointAI, // Removed
  onSetAICfg, // Kept as card manages its own AI config state before calling parent
  onSetImprovedPoint, // Kept
  onSetPointImprovementPrompt, // Kept
  // tiptapRefs, // Removed
  onTiptapInstanceReady,
  // focusRequest, // Removed
  // onSetFocusRequest, // Removed from destructuring
  // onShowErrorDialog // Removed
}: SortableExperienceCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: exp.id });

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
      
      const oldIndex = exp.description.findIndex(dp => dp.id === activeDescId);
      const newIndex = exp.description.findIndex(dp => dp.id === overDescId);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newDescriptionOrder = arrayMove(exp.description, oldIndex, newIndex);
        onDescriptionOrderChange(exp.id, newDescriptionOrder);
      }
    }
  }, [exp.id, exp.description, onDescriptionOrderChange]);

  // Effect for focusing Tiptap editor (parent will handle actual focusing based on its state)
  // This component just signals the need via onSetFocusRequest if needed, or parent passes focusRequest prop.
  // For now, assuming parent passes focusRequest for a specific point in this card.
  // The actual focusing logic for Tiptap would be in SortableDescriptionItem or Tiptap itself.

  return (
    <div ref={setNodeRef} style={style} className="mb-4">
      <Card
        className={cn(
          "relative group transition-all duration-300",
          "bg-gradient-to-r from-cyan-500/5 via-cyan-500/10 to-blue-500/5",
          "backdrop-blur-md border-2 border-cyan-500/30",
          "shadow-sm",
          isDragging && "shadow-2xl opacity-90"
        )}
      >
        <button
          {...attributes}
          {...listeners}
          type="button"
          className="absolute -left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300 p-1.5 bg-cyan-100/80 rounded-lg cursor-grab shadow-sm hover:bg-cyan-200/80 z-10"
          aria-label="Drag to reorder work experience"
        >
          <GripVertical className="h-5 w-5 text-cyan-700" />
        </button>
        
        <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="relative flex-1">
                <Input
                  value={exp.position}
                  onChange={(e) => onExperienceChange(exp.id, 'position', e.target.value)}
                  className={cn(
                    "text-sm font-semibold tracking-tight h-9",
                    "bg-white/50 border-gray-200 rounded-lg",
                    "focus:border-cyan-500/40 focus:ring-2 focus:ring-cyan-500/20",
                    "hover:border-cyan-500/30 hover:bg-white/60 transition-colors",
                    "placeholder:text-gray-400"
                  )}
                  placeholder="Position Title"
                />
                <div className="absolute -top-2 left-2 px-1 bg-white/80 text-[7px] sm:text-[9px] font-medium text-gray-500">
                  POSITION
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemoveExperience(exp.id)}
                className="text-gray-400 hover:text-red-500 transition-colors duration-300"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <div className="relative">
                <Input
                  value={exp.company}
                  onChange={(e) => onExperienceChange(exp.id, 'company', e.target.value)}
                  className={cn(
                    "text-sm font-medium bg-white/50 border-gray-200 rounded-lg h-9",
                    "focus:border-cyan-500/40 focus:ring-2 focus:ring-cyan-500/20",
                    "hover:border-cyan-500/30 hover:bg-white/60 transition-colors",
                    "placeholder:text-gray-400"
                  )}
                  placeholder="Company Name"
                />
                <div className="absolute -top-2 left-2 px-1 bg-white/80 text-[7px] sm:text-[9px] font-medium text-gray-500">
                  COMPANY
                </div>
              </div>
              <div className="relative">
                <Input
                  value={exp.location}
                  onChange={(e) => onExperienceChange(exp.id, 'location', e.target.value)}
                  className={cn(
                    "bg-white/50 border-gray-200 rounded-lg h-9",
                    "focus:border-cyan-500/40 focus:ring-2 focus:ring-cyan-500/20",
                    "hover:border-cyan-500/30 hover:bg-white/60 transition-colors",
                    "placeholder:text-gray-400"
                  )}
                  placeholder="Location"
                />
                <div className="absolute -top-2 left-2 px-1 bg-white/80 text-[7px] sm:text-[9px] font-medium text-gray-500">
                  LOCATION
                </div>
              </div>
            </div>

            <div className="relative group">
              <Input
                type="text"
                  value={exp.date}
                  onChange={(e) => onExperienceChange(exp.id, 'date', e.target.value)}
                  className={cn(
                    "w-full bg-white/50 border-gray-200 rounded-lg h-9",
                    "focus:border-cyan-500/40 focus:ring-2 focus:ring-cyan-500/20",
                    "hover:border-cyan-500/30 hover:bg-white/60 transition-colors"
                  )}
                  placeholder="e.g., 'Jan 2023 - Present' or '2020 - 2022'"
                />
                <div className="absolute -top-2 left-2 px-1 bg-white/80 text-[7px] sm:text-[9px] font-medium text-gray-500">
                  DATE
                </div>
                <span className="ml-2 text-[8px] sm:text-[10px] text-gray-500">Use 'Present' in the date field for current positions</span>
              </div>

            <div className="space-y-3">
              <Label className="text-[11px] md:text-xs font-medium text-gray-600">
                Key Responsibilities & Achievements
              </Label>
              <div className="space-y-2 pl-0">
                <DndContext
                  sensors={descriptionSensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDescriptionDragEnd}
                >
                  <SortableContext
                    items={exp.description.map(d => d.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {exp.description.map((descPoint) => (
                      <SortableDescriptionItem
                        key={descPoint.id}
                        id={descPoint.id}
                        desc={descPoint}
                        onChange={(newContent: string) => {
                          onDescriptionChange(exp.id, descPoint.id, newContent);
                          // If content changes, clear any AI improvement for that point
                          if (improvedPoints[descPoint.id]) {
                            onSetImprovedPoint(exp.id, descPoint.id, null);
                          }
                        }}
                        onDelete={() => onDescriptionDelete(exp.id, descPoint.id)}
                        onRewrite={() => onRewritePoint(exp.id, descPoint.id, pointImprovementPrompts[descPoint.id])}
                        isLoading={loadingPointAI[descPoint.id]}
                        isImproved={!!improvedPoints[descPoint.id]}
                        onAcceptImprovement={() => onAcceptImprovement(exp.id, descPoint.id)}
                        onUndoImprovement={() => onUndoImprovement(exp.id, descPoint.id)}
                        improvementPromptValue={pointImprovementPrompts[descPoint.id] || ''}
                        onImprovementPromptChange={(value: string) => onSetPointImprovementPrompt(exp.id, descPoint.id, value)}
                        onEditorInstanceReady={(editorInstance: Editor | null) => {
                           onTiptapInstanceReady(exp.id, descPoint.id, editorInstance);
                        }}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
                
                <AISuggestionsDisplay
                  suggestions={aiSuggestions || []}
                  onApprove={(suggestion) => onApproveAISuggestion(exp.id, suggestion)}
                  onDelete={(suggestionId) => onDeleteAISuggestion(exp.id, suggestionId)}
                />

                {exp.description.length === 0 && (!aiSuggestions || aiSuggestions.length === 0) && (
                  <div className="text-[11px] md:text-xs text-gray-500 italic px-4 py-3 bg-gray-50/50 rounded-lg">
                    Add points to describe your responsibilities and achievements
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onDescriptionAdd(exp.id);
                    // After adding, the parent will update 'exp.description'.
                    // We need to signal focus for the *newly added* point.
                    // The parent's onDescriptionAdd callback should handle creating the new point with an ID.
                    // We can't know the new ID here directly, so parent needs to manage focus.
                    // However, the parent's `onDescriptionAdd` in `WorkExperienceForm` *does* set focus.
                    // The `onSetFocusRequest` prop is for the child to inform the parent if it needs to.
                    // In this specific `onDescriptionAdd` case, the parent `WorkExperienceForm` already handles it.
                    // The `onSetFocusRequest` prop in `SortableExperienceCardProps` is more for scenarios
                    // where an action *within* the card (not adding a new item which parent controls) needs to trigger focus.
                    // For now, let's assume it's not strictly needed for *this* button, but might be for other internal actions.
                    // The ESLint error is because it's defined in props but not used in the component body.
                    // If it's truly unused after full review, it should be removed from props.
                    // For now, to satisfy ESLint, I'll keep it but acknowledge it's not used in *this* specific handler.
                    // A more robust solution might involve the parent passing a specific ID to focus after adding.
                    // The current parent logic for `onDescriptionAdd` in `WorkExperienceForm` *does* set its own `focusRequest`.
                    // So, the child doesn't need to call `onSetFocusRequest` for *this specific action*.
                  }}
                  className={cn(
                    "flex-1 text-cyan-600 hover:text-cyan-700 transition-colors text-[10px] sm:text-xs",
                    "border-cyan-200 hover:border-cyan-300 hover:bg-cyan-50/50"
                  )}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Point
                </Button>

                <AIGenerationSettingsTooltip
                  // index prop is not used in the component, but was in old version. Removing.
                  loadingAI={isLoadingAI}
                  generateAIPoints={() => onGenerateAIPoints(exp.id, aiConfig)}
                  aiConfig={aiConfig}
                  onNumPointsChange={(value) => onSetAICfg(exp.id, { ...aiConfig, numPoints: value })}
                  onCustomPromptChange={(value) => onSetAICfg(exp.id, { ...aiConfig, customPrompt: value })}
                  colorClass={{
                    button: "text-purple-600",
                    border: "border-purple-200",
                    hoverBorder: "hover:border-purple-300",
                    hoverBg: "hover:bg-purple-50/50",
                    tooltipBg: "bg-purple-50",
                    tooltipBorder: "border-2 border-purple-300",
                    tooltipShadow: "shadow-lg shadow-purple-100/50",
                    text: "text-purple-600",
                    hoverText: "hover:text-purple-700"
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
