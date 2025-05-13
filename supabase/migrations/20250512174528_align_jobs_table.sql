-- Align public.jobs table with application expectations

-- Rename 'company' to 'company_name'
ALTER TABLE public.jobs
RENAME COLUMN company TO company_name;

-- Rename 'title' to 'position_title'
ALTER TABLE public.jobs
RENAME COLUMN title TO position_title;

-- Add missing columns
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS location TEXT NULL,
ADD COLUMN IF NOT EXISTS salary_range TEXT NULL,
ADD COLUMN IF NOT EXISTS keywords TEXT[] NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS work_location TEXT NULL,
ADD COLUMN IF NOT EXISTS employment_type TEXT NULL,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NULL DEFAULT TRUE;
