'use client';

import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useDebouncedValue } from '@/hooks/use-debounced-value'; // Assuming this hook exists

interface SummaryFormProps {
  initialValue: string | null | undefined;
  onUpdate: (value: string) => void;
  title?: string;
  placeholder?: string;
}

const SummaryForm: React.FC<SummaryFormProps> = ({
  initialValue,
  onUpdate,
  title = "Professional Summary",
  placeholder = "Write a brief summary of your professional background and career objectives..."
}) => {
  const [summary, setSummary] = useState(initialValue || '');
  const debouncedSummary = useDebouncedValue(summary, 500); // Debounce for 500ms

  useEffect(() => {
    setSummary(initialValue || '');
  }, [initialValue]);

  useEffect(() => {
    // Only call onUpdate if debouncedSummary is different from initialValue
    // or if initialValue was empty and debouncedSummary now has content.
    // This prevents calling onUpdate on initial load if initialValue is already set.
    if (debouncedSummary !== (initialValue || '')) {
      onUpdate(debouncedSummary);
    }
  }, [debouncedSummary, onUpdate, initialValue]);

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSummary(event.target.value);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="summary-textarea">{title}</Label>
      <Textarea
        id="summary-textarea"
        value={summary}
        onChange={handleChange}
        placeholder={placeholder}
        className="min-h-[120px] resize-y"
      />
    </div>
  );
};

export default SummaryForm;
