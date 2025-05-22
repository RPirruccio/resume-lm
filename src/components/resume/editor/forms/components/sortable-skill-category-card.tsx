'use client';

import React, { useState, useCallback, KeyboardEvent } from 'react';
import { Skill, DescriptionPoint } from "@/lib/types"; // Added DescriptionPoint
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  // KeyboardSensor, // Not used directly here, passed via itemSensors
  // PointerSensor,  // Not used directly here, passed via itemSensors
  // useSensor,      // Not used directly here, passed via itemSensors
  // useSensors,     // Not used directly here, passed via itemSensors
  DragEndEvent,
  SensorDescriptor,
  SensorOptions,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  // sortableKeyboardCoordinates, // Not used directly here
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableSkillItem } from './sortable-skill-item'; // Import the new component

export interface SortableSkillCategoryCardProps {
  skillCategory: Skill;
  itemSensors: SensorDescriptor<SensorOptions>[]; // Sensors for skill items within this card

  onCategoryNameChange: (categoryId: string, newName: string) => void;
  onRemoveCategory: (categoryId: string) => void;
  
  onSkillItemAdd: (categoryId: string, newItem: string) => void;
  onSkillItemRemove: (categoryId: string, itemIndex: number) => void; // Using index for now, could be item ID if items get IDs
  onSkillItemOrderChange: (categoryId: string, newItems: DescriptionPoint[]) => void; // Changed string[] to DescriptionPoint[]
}

export function SortableSkillCategoryCard({
  skillCategory,
  itemSensors,
  onCategoryNameChange,
  onRemoveCategory,
  onSkillItemAdd,
  onSkillItemRemove,
  onSkillItemOrderChange,
}: SortableSkillCategoryCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: skillCategory.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : undefined,
  };

  const [newSkillItem, setNewSkillItem] = useState('');

  const handleSkillItemDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      // active.id and over.id are DescriptionPoint.id
      const oldIndex = skillCategory.items.findIndex(item => item.id === active.id.toString());
      const newIndex = skillCategory.items.findIndex(item => item.id === over.id.toString());

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedItems = arrayMove(skillCategory.items, oldIndex, newIndex);
        onSkillItemOrderChange(skillCategory.id, reorderedItems);
      }
    }
  }, [skillCategory.id, skillCategory.items, onSkillItemOrderChange]);
  
  const handleAddSkillItem = () => {
    const trimmedItem = newSkillItem.trim();
    if (trimmedItem) {
      onSkillItemAdd(skillCategory.id, trimmedItem);
      setNewSkillItem('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkillItem();
    }
  };

  // For SortableContext of skill items, we need unique IDs.
  // If skill items are just strings and can have duplicates, this might be an issue.
  // For now, using the string itself as ID. If items become objects with IDs, this will be more robust.
  // A temporary solution for duplicate strings could be `item + index` but that's not ideal.
  // Best practice would be for skill items to also have unique IDs if they are to be sortable.
  // For this iteration, we'll assume skill item strings within a category are unique enough for DND,
  // or that the user will manage uniqueness.
  const skillItemIds = skillCategory.items.map(item => item.id); // Use DescriptionPoint.id


  return (
    <div ref={setNodeRef} style={style} className="mb-4">
      <Card
        className={cn(
          "relative group transition-all duration-300",
          "bg-gradient-to-r from-rose-500/5 via-rose-500/10 to-pink-500/5", // Adjusted colors for skills
          "backdrop-blur-md border-2 border-rose-500/30", // Adjusted colors
          "shadow-sm",
          isDragging && "shadow-2xl opacity-90"
        )}
      >
        <button
          {...attributes}
          {...listeners}
          type="button"
          className="absolute -left-3 top-8 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300 p-1.5 bg-rose-100/80 rounded-lg cursor-grab shadow-sm hover:bg-rose-200/80 z-10" // Adjusted colors
          aria-label="Drag to reorder skill category"
        >
          <GripVertical className="h-5 w-5 text-rose-700" /> {/* Adjusted colors */}
        </button>
        
        <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="relative group flex-1">
              <Input
                value={skillCategory.category}
                onChange={(e) => onCategoryNameChange(skillCategory.id, e.target.value)}
                className={cn(
                  "text-sm font-medium h-9",
                  "bg-white/50 border-gray-200 rounded-lg",
                  "focus:border-rose-500/40 focus:ring-2 focus:ring-rose-500/20", // Adjusted colors
                  "hover:border-rose-500/30 hover:bg-white/60 transition-colors", // Adjusted colors
                  "placeholder:text-gray-400"
                )}
                placeholder="Skill Category Name (e.g., Programming Languages)"
              />
              <div className="absolute -top-2 left-2 px-1 bg-white/80 text-[7px] sm:text-[9px] font-medium text-rose-700">
                CATEGORY
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemoveCategory(skillCategory.id)}
              className="text-gray-400 hover:text-red-500 transition-colors duration-300"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <DndContext
              sensors={itemSensors}
              collisionDetection={closestCenter}
              onDragEnd={handleSkillItemDragEnd}
            >
              <SortableContext items={skillItemIds} strategy={verticalListSortingStrategy}>
                <div className="flex flex-wrap gap-2">
                  {skillCategory.items.map((item, index) => ( // item is DescriptionPoint
                    <SortableSkillItem
                      key={item.id} 
                      id={item.id}   
                      skillItem={item.content} // Pass content string to SortableSkillItem
                      onRemove={() => onSkillItemRemove(skillCategory.id, index)} // Consider changing to itemId if SortableSkillItem changes
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          <div className="relative group flex gap-2 pt-2">
            <Input
              value={newSkillItem}
              onChange={(e) => setNewSkillItem(e.target.value)}
              onKeyPress={handleKeyPress}
              className={cn(
                "h-9 bg-white/50 border-gray-200 rounded-lg",
                "focus:border-rose-500/40 focus:ring-2 focus:ring-rose-500/20",
                "hover:border-rose-500/30 hover:bg-white/60 transition-colors",
                "placeholder:text-gray-400",
                "text-[10px] sm:text-xs"
              )}
              placeholder="Type a skill and press Enter or click +"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddSkillItem}
              className="h-9 px-2 bg-white/50 hover:bg-white/60 border-rose-200 hover:border-rose-300 text-rose-600 hover:text-rose-700"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <div className="absolute -top-0 left-2 px-1 bg-gradient-to-r from-rose-50/0 via-rose-50/100 to-pink-50/100 text-[7px] sm:text-[9px] font-medium text-rose-700">
              ADD SKILL TO CATEGORY
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
