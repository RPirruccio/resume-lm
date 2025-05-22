'use client';

import { WorkExperience, Profile, DescriptionPoint } from "@/lib/types";
// import { Card, CardContent } from "@/components/ui/card"; // Unused
// import { Input } from "@/components/ui/input"; // Unused
// import { Label } from "@/components/ui/label"; // Unused
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react"; // Removed Trash2, GripVertical as they are in child
import { cn } from "@/lib/utils";
import { ImportFromProfileDialog } from "../../management/dialogs/import-from-profile-dialog";
import { ApiErrorDialog } from "@/components/ui/api-error-dialog";

import { useState, useRef, useEffect, memo, useCallback } from "react"; // Added useCallback
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent, // Added for card dragging
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  // useSortable, // Unused in this file directly
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
// import { CSS } from '@dnd-kit/utilities'; // Unused in this file directly
// Removed Tooltip, Tiptap, AIImprovementPrompt imports as they are now in child components
// Removed: import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider, } from "@/components/ui/tooltip";
import { v4 as uuidv4 } from 'uuid'; // Ensure uuidv4 is imported
import { generateWorkExperiencePoints, improveWorkExperience } from "@/utils/actions/resumes/ai";
// import { AIGenerationSettingsTooltip } from "../components/ai-generation-tooltip"; // Unused directly
// import { AISuggestions as AISuggestionsDisplay } from "../../shared/ai-suggestions"; // Unused directly

import { Editor } from '@tiptap/react'; // Import Editor type
// import { SortableDescriptionItem } from "./components/sortable-description-item"; // Unused directly
import { SortableExperienceCardItem, AISuggestion as CardAISuggestion, ImprovedPoint, CardAIConfig } from "./components/sortable-experience-card"; // Removed FocusRequestForPoint

// Removed old SortableExperienceCardItemProps interface and SortableExperienceCardItem function

// Removed conflicting local AISuggestion interface

interface WorkExperienceFormProps {
  experiences: WorkExperience[];
  onChange: (experiences: WorkExperience[]) => void;
  profile: Profile;
  targetRole?: string;
}

// This local ImprovedPoint might conflict if SortableExperienceCardItem exports it.
// interface ImprovedPoint { 
//   original: DescriptionPoint;
//   improved: string; 
// }

// Renaming and re-keying this state
// interface ImprovementConfig {
//   [key: number]: { [key: number]: string }; // expIndex -> pointIndex -> prompt
// }
interface PointImprovementPromptsMap {
  [experienceId: string]: { [pointId: string]: string };
}


interface ParentFocusRequest { // Renamed to avoid conflict with card's FocusRequest
  experienceIndex: number; // Keep using index here for parent logic
  descriptionIndex: number; // Keep using index here for parent logic
}

// Create a comparison function
function areWorkExperiencePropsEqual(
  prevProps: WorkExperienceFormProps,
  nextProps: WorkExperienceFormProps
) {
  return (
    prevProps.targetRole === nextProps.targetRole &&
    JSON.stringify(prevProps.experiences) === JSON.stringify(nextProps.experiences) &&
    prevProps.profile.id === nextProps.profile.id // Assuming profile object itself doesn't change frequently, only its ID matters for this comparison
  );
}

// Export the memoized component
export const WorkExperienceForm = memo(function WorkExperienceFormComponent({
  experiences,
  onChange,
  profile,
  targetRole = "Software Engineer"
}: WorkExperienceFormProps) {
  // State refactored to use experienceId (string) as key where appropriate
  const [aiSuggestionsMap, setAiSuggestionsMap] = useState<{ [experienceId: string]: CardAISuggestion[] }>({}); // Use aliased type
  const [loadingAIMap, setLoadingAIMap] = useState<{ [experienceId: string]: boolean }>({});
  const [loadingPointAIMap, setLoadingPointAIMap] = useState<{ [experienceId: string]: { [pointId: string]: boolean } }>({});
  const [aiConfigMap, setAiConfigMap] = useState<{ [experienceId: string]: CardAIConfig }>({});
  // popoverOpen and textareaRefs seem unused by the new card structure, keeping them commented for now
  // const [popoverOpen, setPopoverOpen] = useState<{ [key: number]: boolean }>({});
  // const textareaRefs = useRef<{ [key: number]: HTMLTextAreaElement }>({});
  const [improvedPointsMap, setImprovedPointsMap] = useState<{ [experienceId: string]: { [pointId: string]: ImprovedPoint } }>({});
  const [pointImprovementPromptsMap, setPointImprovementPromptsMap] = useState<PointImprovementPromptsMap>({});
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState({ title: '', description: '' });

  const tiptapRefs = useRef<{ [experienceId: string]: { [descriptionId: string]: Editor | null } }>({});
  const [focusRequest, setFocusRequest] = useState<ParentFocusRequest | null>(null);
  
  // Sensors for dragging experience cards
  const experienceSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 0, distance: 0 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const descriptionSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  
  const handleDragEndExperiences = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = experiences.findIndex(exp => exp.id === active.id.toString());
      const newIndex = experiences.findIndex(exp => exp.id === over.id.toString());
      if (oldIndex !== -1 && newIndex !== -1) {
        onChange(arrayMove(experiences, oldIndex, newIndex));
      }
    }
  }, [experiences, onChange]);

  // useEffect for popoverOpen and textareaRefs removed as they are not used with the new card structure.
  
  useEffect(() => {
    if (focusRequest) {
      const { experienceIndex, descriptionIndex } = focusRequest;
      const expId = experiences[experienceIndex]?.id;
      const descId = experiences[experienceIndex]?.description[descriptionIndex]?.id;

      if (expId && descId) {
        const editorInstance = tiptapRefs.current[expId]?.[descId];
        if (editorInstance && typeof editorInstance.commands.focus === 'function') {
          setTimeout(() => editorInstance.commands.focus('end'), 100);
        }
      }
      setFocusRequest(null);
    }
  }, [focusRequest, experiences]);

  const addExperience = () => {
    const newExpId = uuidv4();
    onChange([{
      id: newExpId,
      company: "",
      position: "",
      location: "",
      date: "",
      description: [] as DescriptionPoint[],
      technologies: []
    }, ...experiences]);
    // Initialize states for the new experience
    setAiConfigMap(prev => ({ ...prev, [newExpId]: { numPoints: 3, customPrompt: '' } }));
    setAiSuggestionsMap(prev => ({ ...prev, [newExpId]: [] }));
    setImprovedPointsMap(prev => ({ ...prev, [newExpId]: {} }));
    setPointImprovementPromptsMap(prev => ({ ...prev, [newExpId]: {} }));
    setLoadingAIMap(prev => ({ ...prev, [newExpId]: false }));
    setLoadingPointAIMap(prev => ({ ...prev, [newExpId]: {} }));
    // Other states like loadingAIMap, improvedPointsMap etc. will be set on demand.
  };

  const updateExperienceField = (expId: string, field: keyof WorkExperience, value: string | string[] | DescriptionPoint[]) => {
    const updatedExperiences = experiences.map(exp => 
      exp.id === expId ? { ...exp, [field]: value } : exp
    );
    onChange(updatedExperiences);
  };

  const removeExperienceById = (expId: string) => {
    onChange(experiences.filter(exp => exp.id !== expId));
    // Clean up state for the removed experience
    setAiSuggestionsMap(prev => { const newState = {...prev}; delete newState[expId]; return newState; });
    setLoadingAIMap(prev => { const newState = {...prev}; delete newState[expId]; return newState; });
    setLoadingPointAIMap(prev => { const newState = {...prev}; delete newState[expId]; return newState; });
    setAiConfigMap(prev => { const newState = {...prev}; delete newState[expId]; return newState; });
    setImprovedPointsMap(prev => { const newState = {...prev}; delete newState[expId]; return newState; });
    setPointImprovementPromptsMap(prev => { const newState = {...prev}; delete newState[expId]; return newState; });
    if (tiptapRefs.current[expId]) {
      delete tiptapRefs.current[expId];
    }
  };

  const handleImportFromProfile = (importedExperiences: WorkExperience[]) => {
    const newExperiencesWithIds = importedExperiences.map(exp => ({ ...exp, id: exp.id || uuidv4() }));
    onChange([...newExperiencesWithIds, ...experiences]);
    // Initialize states for imported experiences
    newExperiencesWithIds.forEach(exp => {
      setAiConfigMap(prev => ({ ...prev, [exp.id]: { numPoints: 3, customPrompt: '' } }));
      setAiSuggestionsMap(prev => ({ ...prev, [exp.id]: [] }));
    });
  };

  const generateAIPointsForExperience = async (expId: string, config: CardAIConfig) => {
    const exp = experiences.find(e => e.id === expId);
    if (!exp) return;

    setLoadingAIMap(prev => ({ ...prev, [expId]: true }));
    // setPopoverOpen(prev => ({ ...prev, [index]: false })); // popoverOpen removed
    
    try {
      const MODEL_STORAGE_KEY = 'resumelm-default-model';
      const LOCAL_STORAGE_KEY = 'resumelm-api-keys';
      const selectedModel = localStorage.getItem(MODEL_STORAGE_KEY);
      const storedKeys = localStorage.getItem(LOCAL_STORAGE_KEY);
      let apiKeys = [];
      try { apiKeys = storedKeys ? JSON.parse(storedKeys) : []; } catch (e) { console.error('Error parsing API keys:', e); }

      const result = await generateWorkExperiencePoints(
        exp.position, exp.company, exp.technologies || [], targetRole,
        config.numPoints, config.customPrompt, { model: selectedModel || '', apiKeys }
      );
      
      const newSuggestions = result.points.map((p: string) => ({ id: uuidv4(), point: p }));
      setAiSuggestionsMap(prev => ({ ...prev, [expId]: newSuggestions }));

    } catch (error: Error | unknown) {
      const err = error as Error;
      if (err.message.toLowerCase().includes('api key') || err.message.toLowerCase().includes('unauthorized')) {
        setErrorMessage({ title: "API Key Error", description: "Please check your API key settings." });
      } else {
        setErrorMessage({ title: "Error", description: "Failed to generate AI points." });
      }
      setShowErrorDialog(true);
    } finally {
      setLoadingAIMap(prev => ({ ...prev, [expId]: false }));
    }
  };

  const approveAISuggestionForExperience = (expId: string, suggestion: CardAISuggestion) => { // Use aliased type
    const expIdx = experiences.findIndex(e => e.id === expId);
    if (expIdx === -1) return;

    const updatedExperiences = [...experiences];
    const newPoint: DescriptionPoint = { id: uuidv4(), content: suggestion.point };
    updatedExperiences[expIdx].description = [...updatedExperiences[expIdx].description, newPoint];
    onChange(updatedExperiences);
    
    setAiSuggestionsMap(prev => ({
      ...prev,
      [expId]: (prev[expId] || []).filter(s => s.id !== suggestion.id)
    }));
  };

  const deleteAISuggestionForExperience = (expId: string, suggestionId: string) => {
    setAiSuggestionsMap(prev => ({
      ...prev,
      [expId]: (prev[expId] || []).filter(s => s.id !== suggestionId)
    }));
  };

  const rewritePointForExperience = async (expId: string, pointId: string, customPrompt?: string) => {
    const exp = experiences.find(e => e.id === expId);
    const point = exp?.description.find(p => p.id === pointId);
    if (!exp || !point) return;
    
    setLoadingPointAIMap(prev => ({ ...prev, [expId]: { ...(prev[expId] || {}), [pointId]: true } }));
    
    try {
      const MODEL_STORAGE_KEY = 'resumelm-default-model';
      const LOCAL_STORAGE_KEY = 'resumelm-api-keys';
      const selectedModel = localStorage.getItem(MODEL_STORAGE_KEY);
      const storedKeys = localStorage.getItem(LOCAL_STORAGE_KEY);
      let apiKeys = [];
      try { apiKeys = storedKeys ? JSON.parse(storedKeys) : []; } catch (e) { console.error('Error parsing API keys:', e); }

      const improvedContent = await improveWorkExperience(point.content, customPrompt, { model: selectedModel || '', apiKeys });

      setImprovedPointsMap(prev => ({
        ...prev,
        [expId]: { ...(prev[expId] || {}), [pointId]: { original: point, improved: improvedContent } }
      }));

      const updatedExperiences = experiences.map(e => 
        e.id === expId ? { ...e, description: e.description.map(p => p.id === pointId ? { ...p, content: improvedContent } : p) } : e
      );
      onChange(updatedExperiences);

    } catch (error: Error | unknown) {
      const err = error as Error;
      if (err.message.toLowerCase().includes('api key') || err.message.toLowerCase().includes('unauthorized')) {
        setErrorMessage({ title: "API Key Error", description: "Please check your API key settings." });
      } else {
        setErrorMessage({ title: "Error", description: "Failed to improve point." });
      }
      setShowErrorDialog(true);
    } finally {
      setLoadingPointAIMap(prev => ({ ...prev, [expId]: { ...(prev[expId] || {}), [pointId]: false } }));
    }
  };

  const undoImprovementForExperience = (expId: string, pointId: string) => {
    const improvedPointData = improvedPointsMap[expId]?.[pointId];
    if (improvedPointData) {
      const updatedExperiences = experiences.map(e => 
        e.id === expId ? { ...e, description: e.description.map(p => p.id === pointId ? improvedPointData.original : p) } : e
      );
      onChange(updatedExperiences);
      
      setImprovedPointsMap(prev => {
        const newState = { ...prev };
        if (newState[expId]) {
          delete newState[expId][pointId];
          if (Object.keys(newState[expId]).length === 0) delete newState[expId];
        }
        return newState;
      });
    }
  };
  
  const acceptImprovementForExperience = (expId: string, pointId: string) => {
    setImprovedPointsMap(prev => {
      const newState = { ...prev };
      if (newState[expId]) {
        delete newState[expId][pointId];
        if (Object.keys(newState[expId]).length === 0) delete newState[expId];
      }
      return newState;
    });
  };

  const handleTiptapInstanceReady = (expId: string, descId: string, editor: Editor | null) => {
    if (!tiptapRefs.current[expId]) {
      tiptapRefs.current[expId] = {};
    }
    tiptapRefs.current[expId][descId] = editor;
  };
  
  // const handleSetFocusRequest = (expId: string, request: FocusRequestForPoint | null) => { // Unused
  //   if (request) {
  //     const expIdx = experiences.findIndex(e => e.id === expId);
  //     if (expIdx !== -1) {
  //       const descIdx = experiences[expIdx].description.findIndex(d => d.id === request.descriptionId);
  //       if (descIdx !== -1) {
  //         setFocusRequest({ experienceIndex: expIdx, descriptionIndex: descIdx });
  //       }
  //     }
  //   } else {
  //     setFocusRequest(null);
  //   }
  // };


  return (
    <>
      <div className="space-y-2 sm:space-y-3">
        <div className="@container">
          <div className={cn(
            "flex flex-col @[400px]:flex-row gap-2",
            "transition-all duration-300 ease-in-out"
          )}>
            <Button 
              variant="outline" 
              onClick={addExperience} // Uses new addExperience
              className={cn(
                "flex-1 h-9 min-w-[120px]",
                "bg-gradient-to-r from-cyan-500/5 via-cyan-500/10 to-blue-500/5",
                "hover:from-cyan-500/10 hover:via-cyan-500/15 hover:to-blue-500/10",
                "border-2 border-dashed border-cyan-500/30 hover:border-cyan-500/40",
                "text-cyan-700 hover:text-cyan-800",
                "transition-all duration-300",
                "rounded-xl",
                "whitespace-nowrap text-[11px] @[300px]:text-sm"
              )}
            >
              <Plus className="h-4 w-4 mr-2 shrink-0" />
              Add Work Experience
            </Button>

            <ImportFromProfileDialog<WorkExperience>
              profile={profile}
              onImport={handleImportFromProfile}
              type="work_experience"
              buttonClassName={cn(
                "flex-1 mb-0 h-9 min-w-[120px]",
                "whitespace-nowrap text-[11px] @[300px]:text-sm"
              )}
            />
          </div>
        </div>

        <DndContext sensors={experienceSensors} collisionDetection={closestCenter} onDragEnd={handleDragEndExperiences}>
          <SortableContext items={experiences.map(exp => exp.id)} strategy={verticalListSortingStrategy}>
            {experiences.map((exp) => {
              const expId = exp.id;
              // let currentCardFocusRequest: FocusRequestForPoint | null = null; // Unused
              // The logic to determine if a specific card's point should be focused
              // is now implicitly handled by the parent passing the correct `focusRequest`
              // to the specific card instance if needed, or the card itself managing internal focus.
              // For now, the parent `focusRequest` state is translated to `currentCardFocusRequest`
              // which is then passed to the child.
              // However, the child `SortableExperienceCardItem` no longer accepts `focusRequest` directly.
              // It expects `onSetFocusRequest` to be called by its children if they need to signal a focus event.
              // The parent `WorkExperienceForm` then uses its `focusRequest` state to manage this.
              // The `currentCardFocusRequest` variable was an intermediate step that is no longer needed here.

              return (
                <SortableExperienceCardItem
                  key={expId}
                  experience={exp}
                  descriptionSensors={descriptionSensors}
                  
                  aiSuggestions={aiSuggestionsMap[expId] || []}
                  isLoadingAI={loadingAIMap[expId] || false}
                  loadingPointAI={loadingPointAIMap[expId] || {}}
                  aiConfig={aiConfigMap[expId] || { numPoints: 3, customPrompt: '' }}
                  improvedPoints={improvedPointsMap[expId] || {}}
                  pointImprovementPrompts={pointImprovementPromptsMap[expId] || {}}

                  onExperienceChange={updateExperienceField}
                  onDescriptionChange={(experienceId, descriptionId, newContent) => {
                    const newExperiences = experiences.map(e => 
                      e.id === experienceId ? { ...e, description: e.description.map(d => d.id === descriptionId ? {...d, content: newContent} : d) } : e
                    );
                    onChange(newExperiences);
                    // Clear improvement if content changed
                     setImprovedPointsMap(prev => {
                        const expPoints = { ...(prev[experienceId] || {}) };
                        if (expPoints[descriptionId]) {
                          delete expPoints[descriptionId];
                          return { ...prev, [experienceId]: expPoints };
                        }
                        return prev;
                      });
                  }}
                  onDescriptionDelete={(experienceId, descriptionId) => {
                    const newExperiences = experiences.map(e => 
                      e.id === experienceId ? { ...e, description: e.description.filter(d => d.id !== descriptionId) } : e
                    );
                    onChange(newExperiences);
                  }}
                  onDescriptionAdd={(experienceId) => {
                    const newExperiences = experiences.map(e => 
                      e.id === experienceId ? { ...e, description: [...e.description, { id: uuidv4(), content: "" }] } : e
                    );
                    onChange(newExperiences);
                    // Request focus for the new point
                    const newPointIndex = newExperiences.find(e => e.id === experienceId)!.description.length - 1;
                    const expIdx = newExperiences.findIndex(e => e.id === experienceId);
                    setFocusRequest({experienceIndex: expIdx, descriptionIndex: newPointIndex});
                  }}
                  onDescriptionOrderChange={(experienceId, newDescriptionOrder) => {
                     const newExperiences = experiences.map(e => 
                      e.id === experienceId ? { ...e, description: newDescriptionOrder } : e
                    );
                    onChange(newExperiences);
                  }}
                  onRemoveExperience={removeExperienceById}
                  
                  onGenerateAIPoints={generateAIPointsForExperience}
                  onApproveAISuggestion={approveAISuggestionForExperience}
                  onDeleteAISuggestion={deleteAISuggestionForExperience}
                  
                  onRewritePoint={rewritePointForExperience}
                  onUndoImprovement={undoImprovementForExperience}
                  onAcceptImprovement={acceptImprovementForExperience}

                  onSetAISuggestions={(experienceId, newSuggestions) => setAiSuggestionsMap(prev => ({ ...prev, [experienceId]: newSuggestions }))}
                  onSetIsLoadingAI={(experienceId, isLoading) => setLoadingAIMap(prev => ({ ...prev, [experienceId]: isLoading }))}
                  onSetLoadingPointAI={(experienceId, pointId, isLoading) => setLoadingPointAIMap(prev => ({ ...prev, [experienceId]: { ...(prev[experienceId] || {}), [pointId]: isLoading } }))}
                  onSetAICfg={(experienceId, cfg) => setAiConfigMap(prev => ({ ...prev, [experienceId]: cfg }))}
                  onSetImprovedPoint={(experienceId, pointId, impPoint) => setImprovedPointsMap(prev => {
                    const expPoints = { ...(prev[experienceId] || {}) };
                    if (impPoint === null) delete expPoints[pointId]; else expPoints[pointId] = impPoint;
                    return { ...prev, [experienceId]: expPoints };
                  })}
                  onSetPointImprovementPrompt={(experienceId, pointId, prompt) => setPointImprovementPromptsMap(prev => ({ ...prev, [experienceId]: { ...(prev[experienceId] || {}), [pointId]: prompt } }))}
                  
                  // tiptapRefs prop is managed internally by SortableExperienceCardItem now, not passed from parent directly to it.
                  // The parent (this component) still needs to manage the main tiptapRefs object for all cards.
                  // The onTiptapInstanceReady callback allows the child to inform the parent.
                  onTiptapInstanceReady={handleTiptapInstanceReady}

                  // focusRequest={currentCardFocusRequest} // Removed
                  // onSetFocusRequest={handleSetFocusRequest} // Removed as it's not a prop of SortableExperienceCardItem

                  // onShowErrorDialog={(title: string, description: string) => { setErrorMessage({ title, description }); setShowErrorDialog(true); }} // Removed
                />
              );
            })}
          </SortableContext>
        </DndContext>
      </div>
      
      <ApiErrorDialog
        open={showErrorDialog}
        onOpenChange={setShowErrorDialog}
        errorMessage={errorMessage}
        onUpgrade={() => {
          setShowErrorDialog(false);
          window.location.href = '/subscription';
        }}
        onSettings={() => {
          setShowErrorDialog(false);
          window.location.href = '/settings';
        }}
      />
    </>
  );
}, areWorkExperiencePropsEqual);
