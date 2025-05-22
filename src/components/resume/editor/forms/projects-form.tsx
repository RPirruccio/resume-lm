'use client';

import { Project, Profile, DescriptionPoint } from "@/lib/types";
// Card, CardContent, Input are now primarily in SortableProjectCardItem
// import { Card, CardContent } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// Removed unused Label
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react"; // Removed unused icons
import { cn } from "@/lib/utils";
import { ImportFromProfileDialog } from "../../management/dialogs/import-from-profile-dialog";
import { useState, useEffect, memo, useCallback } from "react"; // Removed unused useRef
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent, // Moved DragEndEvent here
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  // useSortable, // No longer using useSortable at this top level for individual cards
  verticalListSortingStrategy,
  // DragEndEvent, // Removed from here
} from '@dnd-kit/sortable';
// import { CSS } from '@dnd-kit/utilities'; // No longer needed here
import { Editor } from '@tiptap/react'; // Keep for Tiptap instance type
import { v4 as uuidv4 } from 'uuid';
// Tooltip, AISuggestions, etc. will be used by SortableProjectCardItem
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipTrigger,
//   TooltipProvider,
// } from "@/components/ui/tooltip";
// import { AISuggestions } from "../../shared/ai-suggestions";
import { generateProjectPoints, improveProject } from "@/utils/actions/resumes/ai"; // Keep for AI calls
// import { Badge } from "@/components/ui/badge"; // Will be in SortableProjectCardItem
// import { KeyboardEvent } from "react"; // Will be in SortableProjectCardItem
// import Tiptap from "@/components/ui/tiptap"; // Will be in SortableDescriptionItem via SortableProjectCardItem
// import { AIImprovementPrompt } from "../../shared/ai-improvement-prompt"; // Will be in SortableProjectCardItem
// import { AIGenerationSettingsTooltip } from "../components/ai-generation-tooltip"; // Will be in SortableProjectCardItem
import { ApiErrorDialog } from "@/components/ui/api-error-dialog";
import { SortableProjectCardItem, AISuggestion as CardAISuggestion, ImprovedPoint as CardImprovedPoint, CardAIConfig } from "./components/sortable-project-card"; // Import the new component

// Removed unused ProjectAIState interface

interface ProjectsFormProps {
  projects: Project[];
  onChange: (projects: Project[]) => void;
  profile: Profile;
}

// FocusRequest now needs to target by projectId and descriptionId
interface FocusRequest {
  projectId: string;
  descriptionId: string;
}

// SortableProjectDescriptionItem is removed as its functionality is in ./components/sortable-description-item.tsx
// and used by SortableProjectCardItem

function areProjectsPropsEqual(
  prevProps: ProjectsFormProps,
  nextProps: ProjectsFormProps
) {
  return (
    JSON.stringify(prevProps.projects) === JSON.stringify(nextProps.projects) &&
    prevProps.profile.id === nextProps.profile.id
  );
}

export const ProjectsForm = memo(function ProjectsFormComponent({
  projects,
  onChange,
  profile
}: ProjectsFormProps) {
  // AI-related state will now be maps keyed by project.id
  const [aiSuggestionsMap, setAiSuggestionsMap] = useState<{ [projectId: string]: CardAISuggestion[] }>({});
  const [loadingAIMap, setLoadingAIMap] = useState<{ [projectId: string]: boolean }>({});
  const [loadingPointAIMap, setLoadingPointAIMap] = useState<{ [projectId: string]: { [pointId: string]: boolean } }>({});
  const [aiConfigMap, setAiConfigMap] = useState<{ [projectId: string]: CardAIConfig }>({});
  const [improvedPointsMap, setImprovedPointsMap] = useState<{ [projectId: string]: { [pointId: string]: CardImprovedPoint } }>({});
  const [pointImprovementPromptsMap, setPointImprovementPromptsMap] = useState<{ [projectId: string]: { [pointId: string]: string } }>({});
  
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState({ title: '', description: '' });
  
  // Tiptap refs will be managed per card, this form might not need a central one.
  // const tiptapRefs = useRef<{ [projectKey: string]: { [descKey: string]: Editor | null } }>({});
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null); // Keep for focusing new description points

  const descriptionSensors = useSensors( // Sensors for description DND, passed to cards
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const projectCardSensors = useSensors( // Sensors for project card DND
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Effect to focus newly added Tiptap point (within a card)
  // This logic might need to be refined or moved if SortableProjectCardItem handles its own Tiptap instances' focus
  useEffect(() => {
    if (focusRequest) {
      // The actual focusing will be handled within the SortableProjectCardItem
      // or SortableDescriptionItem based on props.
      // This form can set the focusRequest, and the child components can consume it.
      // For now, we'll assume the child components will look for a relevant focus request.
      // The key is that `focusRequest` state change will trigger re-render.
      setFocusRequest(null); // Clear after processing
    }
  }, [focusRequest]);

  const addProject = () => {
    const newProject: Project = {
      id: uuidv4(),
      name: "",
      description: [],
      technologies: [],
      date: "",
      url: "",
      github_url: ""
    };
    onChange([newProject, ...projects]);
    // Initialize AI state for the new project
    setAiSuggestionsMap(prev => ({ ...prev, [newProject.id]: [] }));
    setLoadingAIMap(prev => ({ ...prev, [newProject.id]: false }));
    setLoadingPointAIMap(prev => ({ ...prev, [newProject.id]: {} }));
    setAiConfigMap(prev => ({ ...prev, [newProject.id]: { numPoints: 3, customPrompt: '' } }));
    setImprovedPointsMap(prev => ({ ...prev, [newProject.id]: {} }));
    setPointImprovementPromptsMap(prev => ({ ...prev, [newProject.id]: {} }));
  };

  const handleProjectChange = useCallback((projectId: string, field: keyof Project, value: Project[keyof Project]) => {
    onChange(
      projects.map(p => p.id === projectId ? { ...p, [field]: value } : p)
    );
  }, [projects, onChange]);

  const handleRemoveProject = useCallback((projectId: string) => {
    onChange(projects.filter(p => p.id !== projectId));
    // Clean up AI state for the removed project
    setAiSuggestionsMap(prev => { const newState = {...prev}; delete newState[projectId]; return newState; });
    setLoadingAIMap(prev => { const newState = {...prev}; delete newState[projectId]; return newState; });
    setLoadingPointAIMap(prev => { const newState = {...prev}; delete newState[projectId]; return newState; });
    setAiConfigMap(prev => { const newState = {...prev}; delete newState[projectId]; return newState; });
    setImprovedPointsMap(prev => { const newState = {...prev}; delete newState[projectId]; return newState; });
    setPointImprovementPromptsMap(prev => { const newState = {...prev}; delete newState[projectId]; return newState; });
  }, [projects, onChange]);

  const handleDescriptionChange = useCallback((projectId: string, descriptionId: string, newContent: string) => {
    onChange(
      projects.map(p => 
        p.id === projectId 
        ? { ...p, description: p.description.map(dp => dp.id === descriptionId ? {...dp, content: newContent} : dp) } 
        : p
      )
    );
  }, [projects, onChange]);

  const handleDescriptionAdd = useCallback((projectId: string) => {
    const newPointId = uuidv4();
    onChange(
      projects.map(p => 
        p.id === projectId 
        ? { ...p, description: [...p.description, { id: newPointId, content: '' }] } 
        : p
      )
    );
    setFocusRequest({ projectId, descriptionId: newPointId });
  }, [projects, onChange]);

  const handleDescriptionDelete = useCallback((projectId: string, descriptionId: string) => {
    onChange(
      projects.map(p => 
        p.id === projectId 
        ? { ...p, description: p.description.filter(dp => dp.id !== descriptionId) } 
        : p
      )
    );
  }, [projects, onChange]);
  
  const handleDescriptionOrderChange = useCallback((projectId: string, newDescriptionOrder: DescriptionPoint[]) => {
    onChange(
      projects.map(p => p.id === projectId ? { ...p, description: newDescriptionOrder } : p)
    );
  }, [projects, onChange]);


  const handleImportFromProfile = (importedProjects: Project[]) => {
    const newProjectsWithIds = importedProjects.map(p => ({ ...p, id: p.id || uuidv4() }));
    onChange([...newProjectsWithIds, ...projects]);
    // Initialize AI state for imported projects
    newProjectsWithIds.forEach(p => {
      setAiSuggestionsMap(prev => ({ ...prev, [p.id]: [] }));
      setLoadingAIMap(prev => ({ ...prev, [p.id]: false }));
      setLoadingPointAIMap(prev => ({ ...prev, [p.id]: {} }));
      setAiConfigMap(prev => ({ ...prev, [p.id]: { numPoints: 3, customPrompt: '' } }));
      setImprovedPointsMap(prev => ({ ...prev, [p.id]: {} }));
      setPointImprovementPromptsMap(prev => ({ ...prev, [p.id]: {} }));
    });
  };

  const handleGenerateAIPoints = async (projectId: string, config: CardAIConfig) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    setLoadingAIMap(prev => ({ ...prev, [projectId]: true }));
    
    try {
      const MODEL_STORAGE_KEY = 'resumelm-default-model';
      const LOCAL_STORAGE_KEY = 'resumelm-api-keys';
      const selectedModel = localStorage.getItem(MODEL_STORAGE_KEY);
      const storedKeys = localStorage.getItem(LOCAL_STORAGE_KEY);
      let apiKeys = [];
      try { apiKeys = storedKeys ? JSON.parse(storedKeys) : []; } catch (e) { console.error('Error parsing API keys:', e); }

      const result = await generateProjectPoints(
        project.name,
        project.technologies || [],
        "Software Engineer", 
        config.numPoints,
        config.customPrompt,
        { model: selectedModel || '', apiKeys }
      );
      
      const suggestions = result.points.map((point: string): CardAISuggestion => ({
        id: uuidv4(),
        point
      }));
      
      setAiSuggestionsMap(prev => ({ ...prev, [projectId]: suggestions }));
    } catch (error: Error | unknown) {
      // ... (error handling as before, adapted for maps)
      if (error instanceof Error && (error.message.toLowerCase().includes('api key') || error.message.toLowerCase().includes('unauthorized'))) {
        setErrorMessage({ title: "API Key Error", description: "Please check your API key settings." });
      } else {
        setErrorMessage({ title: "Error", description: "Failed to generate AI points." });
      }
      setShowErrorDialog(true);
    } finally {
      setLoadingAIMap(prev => ({ ...prev, [projectId]: false }));
    }
  };

  const handleApproveAISuggestion = (projectId: string, suggestion: CardAISuggestion) => {
    const newPoint: DescriptionPoint = { id: uuidv4(), content: suggestion.point };
    onChange(
      projects.map(p => 
        p.id === projectId 
        ? { ...p, description: [...p.description, newPoint] } 
        : p
      )
    );
    setAiSuggestionsMap(prev => ({
      ...prev,
      [projectId]: (prev[projectId] || []).filter(s => s.id !== suggestion.id)
    }));
  };

  const handleDeleteAISuggestion = (projectId: string, suggestionId: string) => {
    setAiSuggestionsMap(prev => ({
      ...prev,
      [projectId]: (prev[projectId] || []).filter(s => s.id !== suggestionId)
    }));
  };

  const handleRewritePoint = async (projectId: string, pointId: string, customPrompt?: string) => {
    const project = projects.find(p => p.id === projectId);
    const point = project?.description.find(dp => dp.id === pointId);
    if (!project || !point) return;

    setLoadingPointAIMap(prev => ({ ...prev, [projectId]: { ...(prev[projectId] || {}), [pointId]: true } }));
    
    try {
      const MODEL_STORAGE_KEY = 'resumelm-default-model';
      const LOCAL_STORAGE_KEY = 'resumelm-api-keys';
      const selectedModel = localStorage.getItem(MODEL_STORAGE_KEY);
      const storedKeys = localStorage.getItem(LOCAL_STORAGE_KEY);
      let apiKeys = [];
      try { apiKeys = storedKeys ? JSON.parse(storedKeys) : []; } catch (e) { console.error('Error parsing API keys:', e); }
      
      const improvedContent = await improveProject(point.content, customPrompt, { model: selectedModel || '', apiKeys });

      setImprovedPointsMap(prev => ({
        ...prev,
        [projectId]: {
          ...(prev[projectId] || {}),
          [pointId]: { original: point, improved: improvedContent }
        }
      }));
      onChange(
        projects.map(p => 
          p.id === projectId 
          ? { ...p, description: p.description.map(dp => dp.id === pointId ? {...dp, content: improvedContent} : dp) } 
          : p
        )
      );
    } catch (error: unknown) {
      // ... (error handling as before, adapted for maps)
       if (error instanceof Error && (error.message.toLowerCase().includes('api key') || error.message.toLowerCase().includes('unauthorized'))) {
        setErrorMessage({ title: "API Key Error", description: "Please check your API key settings." });
      } else {
        setErrorMessage({ title: "Error", description: "Failed to improve point." });
      }
      setShowErrorDialog(true);
    } finally {
      setLoadingPointAIMap(prev => ({ ...prev, [projectId]: { ...(prev[projectId] || {}), [pointId]: false } }));
    }
  };

  const handleUndoImprovement = (projectId: string, pointId: string) => {
    const improvedPointData = improvedPointsMap[projectId]?.[pointId];
    if (improvedPointData) {
      onChange(
        projects.map(p => 
          p.id === projectId 
          ? { ...p, description: p.description.map(dp => dp.id === pointId ? improvedPointData.original : dp) } 
          : p
        )
      );
      setImprovedPointsMap(prev => {
        const newState = { ...prev };
        if (newState[projectId]) delete newState[projectId][pointId];
        if (Object.keys(newState[projectId] || {}).length === 0) delete newState[projectId];
        return newState;
      });
    }
  };
  
  const handleAcceptImprovement = (projectId: string, pointId: string) => {
    setImprovedPointsMap(prev => {
      const newState = { ...prev };
      if (newState[projectId]) delete newState[projectId][pointId];
      if (Object.keys(newState[projectId] || {}).length === 0) delete newState[projectId];
      return newState;
    });
  };

  const handleSetAICfg = (projectId: string, cfg: CardAIConfig) => {
    setAiConfigMap(prev => ({ ...prev, [projectId]: cfg }));
  };

  const handleSetImprovedPoint = (projectId: string, pointId: string, impPoint: CardImprovedPoint | null) => {
    setImprovedPointsMap(prev => {
      const projectImprovements = { ...(prev[projectId] || {}) };
      if (impPoint === null) {
        delete projectImprovements[pointId];
      } else {
        projectImprovements[pointId] = impPoint;
      }
      if (Object.keys(projectImprovements).length === 0 && impPoint === null) {
        const newState = {...prev};
        delete newState[projectId];
        return newState;
      }
      return { ...prev, [projectId]: projectImprovements };
    });
  };

  const handleSetPointImprovementPrompt = (projectId: string, pointId: string, prompt: string) => {
    setPointImprovementPromptsMap(prev => ({
      ...prev,
      [projectId]: { ...(prev[projectId] || {}), [pointId]: prompt }
    }));
  };
  
  const handleTiptapInstanceReady = (projectId: string, descriptionId: string, editor: Editor | null) => {
    // This form might not need to store all tiptap instances if focus is handled via props/state.
    // If specific inter-card operations need direct editor access, this could be used.
    // For now, primarily for potential focus management.
    if (focusRequest && focusRequest.projectId === projectId && focusRequest.descriptionId === descriptionId && editor) {
      setTimeout(() => editor.commands.focus('end'), 100);
      setFocusRequest(null); // Clear focus request
    }
  };

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = projects.findIndex((p) => p.id === active.id);
      const newIndex = projects.findIndex((p) => p.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onChange(arrayMove(projects, oldIndex, newIndex));
      }
    }
  }, [projects, onChange]);


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
              onClick={addProject}
              className={cn(
                "flex-1 h-9 min-w-[120px]",
                "bg-gradient-to-r from-violet-500/5 via-violet-500/10 to-purple-500/5",
                "hover:from-violet-500/10 hover:via-violet-500/15 hover:to-purple-500/10",
                "border-2 border-dashed border-violet-500/30 hover:border-violet-500/40",
                "text-violet-700 hover:text-violet-800",
                "transition-all duration-300",
                "rounded-xl",
                "whitespace-nowrap text-[11px] @[300px]:text-sm"
              )}
            >
              <Plus className="h-4 w-4 mr-2 shrink-0" />
              Add Project
            </Button>

            <ImportFromProfileDialog<Project>
              profile={profile}
              onImport={handleImportFromProfile}
              type="projects"
              buttonClassName={cn(
                "flex-1 mb-0 h-9 min-w-[120px]",
                "bg-gradient-to-r from-violet-500/5 via-violet-500/10 to-purple-500/5",
                "hover:from-violet-500/10 hover:via-violet-500/15 hover:to-purple-500/10",
                "border-2 border-dashed border-violet-500/30 hover:border-violet-500/40",
                "text-violet-700 hover:text-violet-800",
                "transition-all duration-300",
                "rounded-xl",
                "whitespace-nowrap text-[11px] @[300px]:text-sm"
              )}
            />
          </div>
        </div>

        <DndContext
          sensors={projectCardSensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={projects.map(p => p.id)} strategy={verticalListSortingStrategy}>
            {projects.map((project) => (
              <SortableProjectCardItem
                key={project.id}
                project={project}
                descriptionSensors={descriptionSensors} // Pass down sensors for nested DND
                
                aiSuggestions={aiSuggestionsMap[project.id] || []}
                isLoadingAI={loadingAIMap[project.id] || false}
                loadingPointAI={loadingPointAIMap[project.id] || {}}
                aiConfig={aiConfigMap[project.id] || { numPoints: 3, customPrompt: '' }}
                improvedPoints={improvedPointsMap[project.id] || {}}
                pointImprovementPrompts={pointImprovementPromptsMap[project.id] || {}}

                onProjectChange={handleProjectChange}
                onDescriptionChange={handleDescriptionChange}
                onDescriptionAdd={handleDescriptionAdd}
                onDescriptionDelete={handleDescriptionDelete}
                onDescriptionOrderChange={handleDescriptionOrderChange}
                onRemoveProject={handleRemoveProject}
                
                onGenerateAIPoints={handleGenerateAIPoints}
                onApproveAISuggestion={handleApproveAISuggestion}
                onDeleteAISuggestion={handleDeleteAISuggestion}
                
                onRewritePoint={handleRewritePoint}
                onUndoImprovement={handleUndoImprovement}
                onAcceptImprovement={handleAcceptImprovement}

                onSetAICfg={handleSetAICfg}
                onSetImprovedPoint={handleSetImprovedPoint}
                onSetPointImprovementPrompt={handleSetPointImprovementPrompt}
                onTiptapInstanceReady={handleTiptapInstanceReady}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {/* Add Error Alert Dialog at the end */}
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
}, areProjectsPropsEqual);
