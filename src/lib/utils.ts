import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
// WorkExperience, Education, Project are implicitly handled by the generic type T extends { date?: string }
// We might still need them if we want to be more explicit or if other parts of utils.ts use them.
// For now, the generic constraint is enough for the sorting function.
// import { WorkExperience, Education, Project } from "@/lib/types"; 

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function sanitizeUnknownStrings<T>(data: T): T {
  if (typeof data === 'string') {
    return (data === '<UNKNOWN>' ? '' : data) as T;
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizeUnknownStrings(item)) as T;
  }
  if (typeof data === 'object' && data !== null) {
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, sanitizeUnknownStrings(value)])
    ) as T;
  }
  return data;
}

// Function to parse item date strings (generalized)
export function parseItemDateString(dateStr: string | undefined): { startDate: Date | null, endDate: Date | null } {
  if (!dateStr || typeof dateStr !== 'string') {
    return { startDate: null, endDate: null };
  }

  const parts = dateStr.split('-').map(part => part.trim());
  let startDate: Date | null = null;
  let endDate: Date | null = null;

  if (parts.length > 0 && parts[0]) {
    const startParts = parts[0].split('/');
    if (startParts.length === 2) {
      const month = parseInt(startParts[0], 10);
      const year = parseInt(startParts[1], 10);
      if (!isNaN(month) && !isNaN(year) && month >= 1 && month <= 12) {
        startDate = new Date(year, month - 1, 1); // Month is 0-indexed
      }
    }
  }

  if (parts.length > 1 && parts[1]) {
    if (parts[1].toLowerCase() === 'present') {
      endDate = new Date(); // Current date for "Present"
    } else {
      const endParts = parts[1].split('/');
      if (endParts.length === 2) {
        const month = parseInt(endParts[0], 10);
        const year = parseInt(endParts[1], 10);
        if (!isNaN(month) && !isNaN(year) && month >= 1 && month <= 12) {
          endDate = new Date(year, month, 0); // Last day of the month
        }
      }
    }
  }
  
  // If only one part is provided (e.g., "MM/YYYY" without a range), treat it as both start and end
  if (parts.length === 1 && startDate && !endDate) {
    const startMonth = startDate.getMonth();
    const startYear = startDate.getFullYear();
    endDate = new Date(startYear, startMonth + 1, 0); // Last day of the start month
  }


  return { startDate, endDate };
}

// Function to sort items by date (generalized)
export function sortItemsByDate<T extends { date?: string }>(items: T[]): T[] {
  if (!Array.isArray(items)) return [];
  return [...items].sort((a, b) => {
    const { startDate: aStart, endDate: aEnd } = parseItemDateString(a.date);
    const { startDate: bStart, endDate: bEnd } = parseItemDateString(b.date);

    // Handle cases where dates might be null (e.g. invalid format)
    // Entries with null end dates should go to the bottom or top based on preference,
    // here we'll push them to the bottom if comparing against valid dates.
    if (!aEnd && bEnd) return 1; // a is null, b is not, so a comes after b
    if (aEnd && !bEnd) return -1; // a is not null, b is, so a comes before b
    if (!aEnd && !bEnd) { // both end dates are null
        if (!aStart && bStart) return 1;
        if (aStart && !bStart) return -1;
        if (!aStart && !bStart) return 0;
        // If both end dates are null, sort by start date (if available)
        return (bStart!.getTime() - aStart!.getTime()); // descending start date
    }


    // Primary sort: endDate descending
    if (aEnd!.getTime() !== bEnd!.getTime()) {
      return bEnd!.getTime() - aEnd!.getTime();
    }

    // Secondary sort: startDate descending (if endDates are equal)
    // Handle cases where start dates might be null
    if (!aStart && bStart) return 1;
    if (aStart && !bStart) return -1;
    if (!aStart && !bStart) return 0;
    
    return bStart!.getTime() - aStart!.getTime();
  });
}
