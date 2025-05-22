'use client';

import { Skill, Profile, DescriptionPoint } from "@/lib/types"; // Added DescriptionPoint
// Card, CardContent, Input, Badge are now in SortableSkillCategoryCard or SortableSkillItem
// import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react"; // Trash2 is in SortableSkillCategoryCard
// import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ImportFromProfileDialog } from "../../management/dialogs/import-from-profile-dialog";
import { useCallback } from 'react'; // Removed useState and KeyboardEvent
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
import { SortableSkillCategoryCard } from "./components/sortable-skill-category-card";

interface SkillsFormProps {
  skills: Skill[];
  onChange: (skills: Skill[]) => void;
  profile: Profile;
}

export function SkillsForm({
  skills,
  onChange,
  profile
}: SkillsFormProps) {
  // newSkills state is managed within each SortableSkillCategoryCard now

  const categorySensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const itemSensors = useSensors( // To be passed to each category card for its items
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );


  const addSkillCategory = () => {
    onChange([{
      id: uuidv4(), // Add ID
      category: "",
      items: []
    }, ...skills]);
  };

  const handleCategoryNameChange = useCallback((categoryId: string, newName: string) => {
    onChange(
      skills.map(sc => sc.id === categoryId ? { ...sc, category: newName } : sc)
    );
  }, [skills, onChange]);

  const handleRemoveCategory = useCallback((categoryId: string) => {
    onChange(skills.filter(sc => sc.id !== categoryId));
  }, [skills, onChange]);

  const handleSkillItemAdd = useCallback((categoryId: string, newItemContent: string) => {
    onChange(
      skills.map(sc => 
        sc.id === categoryId 
        ? { ...sc, items: [...sc.items, { id: uuidv4(), content: newItemContent }] } 
        : sc
      )
    );
  }, [skills, onChange]);
  
  const handleSkillItemRemove = useCallback((categoryId: string, itemIndex: number) => {
    onChange(
      skills.map(sc => 
        sc.id === categoryId 
        ? { ...sc, items: sc.items.filter((_, idx) => idx !== itemIndex) } 
        : sc
      )
    );
  }, [skills, onChange]);

  const handleSkillItemOrderChange = useCallback((categoryId: string, newItems: DescriptionPoint[]) => { // Changed string[] to DescriptionPoint[]
    onChange(
      skills.map(sc => sc.id === categoryId ? { ...sc, items: newItems } : sc)
    );
  }, [skills, onChange]);


  const handleImportFromProfile = (importedSkills: Skill[]) => {
    const newSkillsWithIds = importedSkills.map(s => ({
      ...s,
      id: s.id || uuidv4(),
      items: s.items.map(item => 
        typeof item === 'string' ? { id: uuidv4(), content: item } : item
      ) as DescriptionPoint[] // Ensure items are DescriptionPoint[]
    }));
    onChange([...newSkillsWithIds, ...skills]);
  };
  
  const handleCategoryDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = skills.findIndex((s) => s.id === active.id);
      const newIndex = skills.findIndex((s) => s.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onChange(arrayMove(skills, oldIndex, newIndex));
      }
    }
  }, [skills, onChange]);

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
              "bg-gradient-to-r from-rose-500/5 via-rose-500/10 to-pink-500/5",
              "hover:from-rose-500/10 hover:via-rose-500/15 hover:to-pink-500/10",
              "border-2 border-dashed border-rose-500/30 hover:border-rose-500/40",
              "text-rose-700 hover:text-rose-800",
              "transition-all duration-300",
              "rounded-xl",
              "whitespace-nowrap text-[11px] @[300px]:text-sm"
            )}
            onClick={addSkillCategory}
          >
            <Plus className="h-4 w-4 mr-2 shrink-0" />
            Add Skill Category
          </Button>

          <ImportFromProfileDialog<Skill>
            profile={profile}
            onImport={handleImportFromProfile}
            type="skills"
            buttonClassName={cn(
              "flex-1 mb-0 h-9 min-w-[120px]",
              "whitespace-nowrap text-[11px] @[300px]:text-sm",
              "bg-gradient-to-r from-rose-500/5 via-rose-500/10 to-pink-500/5",
              "hover:from-rose-500/10 hover:via-rose-500/15 hover:to-pink-500/10",
              "border-2 border-dashed border-rose-500/30 hover:border-rose-500/40",
              "text-rose-700 hover:text-rose-800"
            )}
          />
        </div>
      </div>

      <DndContext
        sensors={categorySensors}
        collisionDetection={closestCenter}
        onDragEnd={handleCategoryDragEnd}
      >
        <SortableContext items={skills.map(s => s.id)} strategy={verticalListSortingStrategy}>
          {skills.map((skillCategory) => (
            <SortableSkillCategoryCard
              key={skillCategory.id}
              skillCategory={skillCategory}
              itemSensors={itemSensors} // Pass down sensors for nested DND
              onCategoryNameChange={handleCategoryNameChange}
              onRemoveCategory={handleRemoveCategory}
              onSkillItemAdd={handleSkillItemAdd}
              onSkillItemRemove={handleSkillItemRemove}
              onSkillItemOrderChange={handleSkillItemOrderChange}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
