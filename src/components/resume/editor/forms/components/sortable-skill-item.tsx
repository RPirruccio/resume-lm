'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X as RemoveIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SortableSkillItemProps {
  id: string;
  skillItem: string;
  onRemove: () => void;
}

export function SortableSkillItem({ id, skillItem, onRemove }: SortableSkillItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-1.5">
      <button
        {...attributes}
        {...listeners}
        type="button"
        className="cursor-grab p-1 opacity-50 hover:opacity-100 transition-opacity"
        aria-label="Drag to reorder skill item"
      >
        <GripVertical className="h-3.5 w-3.5 text-gray-400" />
      </button>
      <Badge
        variant="secondary"
        className={cn(
          "bg-white/60 hover:bg-white/80 text-rose-700 border border-rose-200 py-0.5 pr-1 pl-2", // Adjusted padding
          "transition-all duration-300 group/badge cursor-default text-[10px] sm:text-xs"
        )}
      >
        {skillItem}
        <button
          onClick={onRemove}
          className="ml-1.5 text-rose-400 hover:text-rose-600 opacity-50 hover:opacity-100 transition-opacity"
          aria-label="Remove skill item"
        >
          <RemoveIcon className="h-3 w-3" />
        </button>
      </Badge>
    </div>
  );
}
