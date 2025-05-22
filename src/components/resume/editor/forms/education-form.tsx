'use client';

import { Education, Profile } from "@/lib/types";
// Card, CardContent, Input, Label, Tiptap are now in SortableEducationCard
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react"; // Trash2 is in SortableEducationCard
import { ImportFromProfileDialog } from "../../management/dialogs/import-from-profile-dialog";
import { memo, useCallback } from 'react'; // Added useCallback
import { cn } from "@/lib/utils";
import { v4 as uuidv4 } from 'uuid'; // For generating IDs

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { SortableEducationCard } from "./components/sortable-education-card"; // Import the new component


interface EducationFormProps {
  education: Education[];
  onChange: (education: Education[]) => void;
  profile: Profile;
}

function areEducationPropsEqual(
  prevProps: EducationFormProps,
  nextProps: EducationFormProps
) {
  return (
    JSON.stringify(prevProps.education) === JSON.stringify(nextProps.education) &&
    prevProps.profile.id === nextProps.profile.id
  );
}

export const EducationForm = memo(function EducationFormComponent({
  education,
  onChange,
  profile
}: EducationFormProps) {

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const addEducation = () => {
    onChange([{
      id: uuidv4(), // Add unique ID
      school: "",
      degree: "",
      field: "",
      location: "",
      date: "",
      gpa: undefined,
      achievements: []
    }, ...education]);
  };

  const handleEducationChange = useCallback((educationId: string, field: keyof Education, value: string | string[] | number) => {
    onChange(
      education.map(edu => 
        edu.id === educationId ? { ...edu, [field]: value } : edu
      )
    );
  }, [education, onChange]);

  const handleRemoveEducation = useCallback((educationId: string) => {
    onChange(education.filter(edu => edu.id !== educationId));
  }, [education, onChange]);
  
  const handleImportFromProfile = (importedEducation: Education[]) => {
    const newEducationWithIds = importedEducation.map(edu => ({
      ...edu,
      id: edu.id || uuidv4(), // Ensure imported items have IDs
      // If achievements need to be DescriptionPoint[], transform here
    }));
    onChange([...newEducationWithIds, ...education]);
  };

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = education.findIndex((e) => e.id === active.id);
      const newIndex = education.findIndex((e) => e.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onChange(arrayMove(education, oldIndex, newIndex));
      }
    }
  }, [education, onChange]);

  return (
    <div className="space-y-2 sm:space-y-3">
      <div className="@container">
        <div className={cn(
          "flex flex-col @[400px]:flex-row gap-2",
          "transition-all duration-300 ease-in-out"
        )}>
          <Button 
            variant="outline" 
            className={cn(
              "flex-1 h-9 min-w-[120px]",
              "bg-gradient-to-r from-indigo-500/5 via-indigo-500/10 to-blue-500/5",
              "hover:from-indigo-500/10 hover:via-indigo-500/15 hover:to-blue-500/10",
              "border-2 border-dashed border-indigo-500/30 hover:border-indigo-500/40",
              "text-indigo-700 hover:text-indigo-800",
              "transition-all duration-300",
              "rounded-xl",
              "whitespace-nowrap text-[11px] @[300px]:text-sm"
            )}
            onClick={addEducation}
          >
            <Plus className="h-4 w-4 mr-2 shrink-0" />
            Add Education
          </Button>

          <ImportFromProfileDialog<Education>
            profile={profile}
            onImport={handleImportFromProfile}
            type="education"
            buttonClassName={cn(
              "flex-1 mb-0 h-9 min-w-[120px]",
              "whitespace-nowrap text-[11px] @[300px]:text-sm",
              "bg-gradient-to-r from-indigo-500/5 via-indigo-500/10 to-blue-500/5",
              "hover:from-indigo-500/10 hover:via-indigo-500/15 hover:to-blue-500/10",
              "border-2 border-dashed border-indigo-500/30 hover:border-indigo-500/40",
              "text-indigo-700 hover:text-indigo-800"
            )}
          />
        </div>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={education.map(e => e.id)} strategy={verticalListSortingStrategy}>
          {education.map((eduItem) => (
            <SortableEducationCard
              key={eduItem.id}
              educationItem={eduItem}
              onEducationChange={handleEducationChange}
              onRemoveEducation={handleRemoveEducation}
              // Pass achievement related props if/when achievements DND is implemented
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}, areEducationPropsEqual);
