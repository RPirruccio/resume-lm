'use client';

import React, { useCallback } from 'react';
import { Education, DescriptionPoint } from "@/lib/types"; // Assuming achievements might become DescriptionPoint[] later
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea"; // For achievements if multi-line
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
import { v4 as uuidv4 } from 'uuid'; // For generating achievement IDs if needed

// Placeholder for SortableAchievementItem if we implement DND for achievements
// import { SortableAchievementItem } from './sortable-achievement-item'; 

export interface SortableEducationCardProps {
  educationItem: Education;
  // sensors for achievement DND if implemented
  // achievementSensors: SensorDescriptor<SensorOptions>[]; 
  
  onEducationChange: (educationId: string, field: keyof Education, value: string | string[] | number) => void;
  onRemoveEducation: (educationId: string) => void;
  
  // Callbacks for achievements if they become sortable DescriptionPoint-like items
  // onAchievementChange: (educationId: string, achievementId: string, newContent: string) => void;
  // onAchievementDelete: (educationId: string, achievementId: string) => void;
  // onAchievementAdd: (educationId: string) => void;
  // onAchievementOrderChange: (educationId: string, newAchievements: string[] | DescriptionPoint[]) => void;
}

export function SortableEducationCard({
  educationItem: edu,
  onEducationChange,
  onRemoveEducation,
}: SortableEducationCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: edu.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : undefined,
  };

  // Handler for simple string achievements (no DND for now)
  const handleAchievementChange = (index: number, value: string) => {
    const newAchievements = [...(edu.achievements || [])];
    newAchievements[index] = value;
    onEducationChange(edu.id, 'achievements', newAchievements);
  };

  const addAchievement = () => {
    const newAchievements = [...(edu.achievements || []), ''];
    onEducationChange(edu.id, 'achievements', newAchievements);
  };

  const removeAchievement = (index: number) => {
    const newAchievements = (edu.achievements || []).filter((_, i) => i !== index);
    onEducationChange(edu.id, 'achievements', newAchievements);
  };


  return (
    <div ref={setNodeRef} style={style} className="mb-4">
      <Card
        className={cn(
          "relative group transition-all duration-300",
          "bg-gradient-to-r from-green-500/5 via-green-500/10 to-emerald-500/5", // Education theme
          "backdrop-blur-md border-2 border-green-500/30",
          "shadow-sm",
          isDragging && "shadow-2xl opacity-90"
        )}
      >
        <button
          {...attributes}
          {...listeners}
          type="button"
          className="absolute -left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300 p-1.5 bg-green-100/80 rounded-lg cursor-grab shadow-sm hover:bg-green-200/80 z-10"
          aria-label="Drag to reorder education entry"
        >
          <GripVertical className="h-5 w-5 text-green-700" />
        </button>
        
        <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="relative flex-1">
                <Input
                  value={edu.school}
                  onChange={(e) => onEducationChange(edu.id, 'school', e.target.value)}
                  className={cn(
                    "text-sm font-semibold tracking-tight h-9",
                    "bg-white/50 border-gray-200 rounded-lg",
                    "focus:border-green-500/40 focus:ring-2 focus:ring-green-500/20",
                    "hover:border-green-500/30 hover:bg-white/60 transition-colors",
                    "placeholder:text-gray-400"
                  )}
                  placeholder="School or Institution Name"
                />
                <div className="absolute -top-2 left-2 px-1 bg-white/80 text-[7px] sm:text-[9px] font-medium text-gray-500">
                  SCHOOL/INSTITUTION
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemoveEducation(edu.id)}
                className="text-gray-400 hover:text-red-500 transition-colors duration-300"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <div className="relative">
                <Input
                  value={edu.degree}
                  onChange={(e) => onEducationChange(edu.id, 'degree', e.target.value)}
                  className={cn(
                    "text-sm font-medium bg-white/50 border-gray-200 rounded-lg h-9",
                    "focus:border-green-500/40 focus:ring-2 focus:ring-green-500/20",
                    "hover:border-green-500/30 hover:bg-white/60 transition-colors",
                    "placeholder:text-gray-400"
                  )}
                  placeholder="Degree (e.g., Bachelor of Science)"
                />
                <div className="absolute -top-2 left-2 px-1 bg-white/80 text-[7px] sm:text-[9px] font-medium text-gray-500">
                  DEGREE
                </div>
              </div>
              <div className="relative">
                <Input
                  value={edu.field}
                  onChange={(e) => onEducationChange(edu.id, 'field', e.target.value)}
                  className={cn(
                    "bg-white/50 border-gray-200 rounded-lg h-9",
                    "focus:border-green-500/40 focus:ring-2 focus:ring-green-500/20",
                    "hover:border-green-500/30 hover:bg-white/60 transition-colors",
                    "placeholder:text-gray-400"
                  )}
                  placeholder="Field of Study (e.g., Computer Science)"
                />
                <div className="absolute -top-2 left-2 px-1 bg-white/80 text-[7px] sm:text-[9px] font-medium text-gray-500">
                  FIELD OF STUDY
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <div className="relative">
                <Input
                  value={edu.location || ''}
                  onChange={(e) => onEducationChange(edu.id, 'location', e.target.value)}
                  className={cn(
                    "bg-white/50 border-gray-200 rounded-lg h-9",
                    "focus:border-green-500/40 focus:ring-2 focus:ring-green-500/20",
                    "hover:border-green-500/30 hover:bg-white/60 transition-colors",
                    "placeholder:text-gray-400"
                  )}
                  placeholder="Location (e.g., City, Country)"
                />
                <div className="absolute -top-2 left-2 px-1 bg-white/80 text-[7px] sm:text-[9px] font-medium text-gray-500">
                  LOCATION
                </div>
              </div>
              <div className="relative group">
                <Input
                  type="text"
                  value={edu.date}
                  onChange={(e) => onEducationChange(edu.id, 'date', e.target.value)}
                  className={cn(
                    "w-full bg-white/50 border-gray-200 rounded-lg h-9",
                    "focus:border-green-500/40 focus:ring-2 focus:ring-green-500/20",
                    "hover:border-green-500/30 hover:bg-white/60 transition-colors"
                  )}
                  placeholder="e.g., May 2020 or 2016 - 2020"
                />
                <div className="absolute -top-2 left-2 px-1 bg-white/80 text-[7px] sm:text-[9px] font-medium text-gray-500">
                  DATE
                </div>
              </div>
            </div>
             <div className="relative">
                <Input
                  value={String(edu.gpa || '')}
                  onChange={(e) => onEducationChange(edu.id, 'gpa', e.target.value)}
                  className={cn(
                    "bg-white/50 border-gray-200 rounded-lg h-9",
                    "focus:border-green-500/40 focus:ring-2 focus:ring-green-500/20",
                    "hover:border-green-500/30 hover:bg-white/60 transition-colors",
                    "placeholder:text-gray-400"
                  )}
                  placeholder="GPA (Optional)"
                />
                <div className="absolute -top-2 left-2 px-1 bg-white/80 text-[7px] sm:text-[9px] font-medium text-gray-500">
                  GPA (OPTIONAL)
                </div>
              </div>

            <div className="space-y-3 pt-2">
              <Label className="text-[11px] md:text-xs font-medium text-gray-600">
                Key Achievements/Coursework (Optional)
              </Label>
              <div className="space-y-2 pl-0">
                {(edu.achievements || []).map((achievement, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Textarea
                      value={achievement}
                      onChange={(e) => handleAchievementChange(index, e.target.value)}
                      placeholder={`Achievement or relevant course ${index + 1}`}
                      className={cn(
                        "flex-1 text-xs bg-white/50 border-gray-200 rounded-lg resize-none",
                        "focus:border-green-500/40 focus:ring-2 focus:ring-green-500/20",
                        "hover:border-green-500/30 hover:bg-white/60 transition-colors"
                      )}
                      rows={1}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAchievement(index)}
                      className="text-gray-400 hover:text-red-500 transition-colors duration-300 shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                 <Button
                  variant="outline"
                  size="sm"
                  onClick={addAchievement}
                  className={cn(
                    "w-full text-green-600 hover:text-green-700 transition-colors text-[10px] sm:text-xs",
                    "border-green-200 hover:border-green-300 hover:bg-green-50/50"
                  )}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Achievement/Course
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
