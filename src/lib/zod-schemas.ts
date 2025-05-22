import { z } from "zod";

// Base schemas for reusable components - Used for AI generation target
// Descriptions added to guide the LLM. Key fields made non-optional.
export const workExperienceSchema = z.object({
  company: z.string().describe("Name of the company."),
  position: z.string().describe("Job title or position held."),
  location: z.string().optional().describe("Location of the company (e.g., City, State or Remote)."),
  date: z.string().describe("Employment dates (e.g., MM/YYYY - MM/YYYY or MM/YYYY - Present)."),
  description: z.array(z.string()).describe("Array of strings. Each string MUST be a complete bullet point detailing a key responsibility or achievement, formatted as a self-contained STAR (Situation, Task, Action, Result) statement. Aim for 3-4 such bullet points per work experience. Ensure all experiences are included; for less relevant ones, focus on transferable soft skills using the STAR method."),
  technologies: z.array(z.string()).optional().describe("List of relevant technologies used."),
});

export const educationSchema = z.object({
  school: z.string().describe("Name of the educational institution."),
  degree: z.string().describe("Degree obtained (e.g., Bachelor of Science)."),
  field: z.string().optional().describe("Field of study (e.g., Computer Science)."),
  location: z.string().optional().describe("Location of the institution."),
  date: z.string().optional().describe("Dates attended or graduation date."),
  gpa: z.string().optional().describe("Grade Point Average (GPA), if relevant."),
  achievements: z.array(z.string()).optional().describe("List of relevant achievements or honors."),
});

export const projectSchema = z.object({
  name: z.string().describe("Name of the project."),
  description: z.array(z.string()).describe("Array of strings. Each string MUST be a complete bullet point detailing a key feature, responsibility, or achievement, formatted as a self-contained STAR (Situation, Task, Action, Result) statement. Aim for 2-4 such bullet points per project."),
  date: z.string().optional().describe("Date or timeframe of the project."),
  technologies: z.array(z.string()).optional().describe("List of relevant technologies used."),
  url: z.string().optional().describe("URL link to the live project (e.g., https://example.com). This should be a valid URL string if provided."),
  github_url: z.string().optional().describe("URL link to the project's GitHub repository (e.g., https://github.com/user/repo). This should be a valid URL string if provided."),
});

export const skillSchema = z.object({
  category: z.string().describe("Category of the skills (e.g., Frontend Development, Cloud & DevOps)."),
  items: z.array(z.string()).describe("List of specific skills within the category."),
});


// Schema for text import functionality
export const textImportSchema = z.object({
  // Basic Information
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().optional(),
  phone_number: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional(),
  linkedin_url: z.string().optional(),
  github_url: z.string().optional(),
  
  // Resume Sections
  work_experience: z.array(z.object({
    company: z.string(),
    position: z.string(),
    date: z.string(),
    description: z.array(z.string()),
    technologies: z.array(z.string()).optional(),
    location: z.string().optional(),
  })).optional(),
  education: z.array(z.object({
    school: z.string(),
    degree: z.string(),
    field: z.string().optional(),
    date: z.string().optional(),
    description: z.array(z.string()).optional(),
    gpa: z.string().optional(),
    location: z.string().optional(),
    achievements: z.array(z.string()).optional(),
  })).optional(),
  skills: z.array(z.object({
    category: z.string(),
    items: z.array(z.string()),
  })).optional(),
  projects: z.array(z.object({
    name: z.string(),
    description: z.array(z.string()),
    technologies: z.array(z.string()).optional(),
    date: z.string().optional(),
    url: z.string().optional(),
    github_url: z.string().optional(),
  })).optional(),
});

export const documentSettingsSchema = z.object({
  // Global Settings
  document_font_size: z.number(),
  document_line_height: z.number(),
  document_margin_vertical: z.number(),
  document_margin_horizontal: z.number(),

  // Header Settings
  header_name_size: z.number(),
  header_name_bottom_spacing: z.number(),

  // Skills Section
  skills_margin_top: z.number(),
  skills_margin_bottom: z.number(),
  skills_margin_horizontal: z.number(),
  skills_item_spacing: z.number(),

  // Experience Section
  experience_margin_top: z.number(),
  experience_margin_bottom: z.number(),
  experience_margin_horizontal: z.number(),
  experience_item_spacing: z.number(),

  // Projects Section
  projects_margin_top: z.number(),
  projects_margin_bottom: z.number(),
  projects_margin_horizontal: z.number(),
  projects_item_spacing: z.number(),

  // Education Section
  education_margin_top: z.number(),
  education_margin_bottom: z.number(),
  education_margin_horizontal: z.number(),
  education_item_spacing: z.number(),
});

export const sectionConfigSchema = z.object({
  visible: z.boolean(),
  max_items: z.number().nullable().optional(),
  style: z.enum(['grouped', 'list', 'grid']).optional(),
});

// Main Resume Schema
export const resumeSchema = z.object({
//   id: z.string().uuid(),
//   user_id: z.string().uuid(),
  name: z.string(),
  target_role: z.string(),
//   is_base_resume: z.boolean(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().email().optional(),
  phone_number: z.string().optional(),
  location: z.string().optional(),
  website: z.string().url().optional(),
  linkedin_url: z.string().url().optional(),
  github_url: z.string().url().optional(),
  work_experience: z.array(workExperienceSchema).optional(),
  education: z.array(educationSchema).optional(),
  skills: z.array(skillSchema).optional(),
  projects: z.array(projectSchema).optional(),

//   created_at: z.string().datetime(),
//   updated_at: z.string().datetime(),
//   document_settings: documentSettingsSchema.optional(),
//   section_order: z.array(z.string()).optional(),
//   section_configs: z.record(sectionConfigSchema).optional(),
  // Note: professional_summary is intentionally omitted from simplifiedResumeSchema
  // as it's often better generated contextually or added later.
  // Basic contact info is also omitted as it should come from the base resume.
  has_cover_letter: z.boolean().default(false).optional(), // Keep optional as it's not core to tailoring
  cover_letter: z.record(z.unknown()).nullable().optional(), // Keep optional
});

// Type inference helpers
export type Resume = z.infer<typeof resumeSchema>;
export type WorkExperience = z.infer<typeof workExperienceSchema>;
export type Education = z.infer<typeof educationSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Skill = z.infer<typeof skillSchema>;
export type DocumentSettings = z.infer<typeof documentSettingsSchema>;
export type SectionConfig = z.infer<typeof sectionConfigSchema>;


// Jobs schema
export const jobSchema = z.object({
  id: z.string().uuid(),
  company_name: z.string().optional(),
  position_title: z.string().optional(),
  job_url: z.string().url().nullable(),
  description: z.string().nullable(),
  location: z.string().nullable(),
  salary_range: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  keywords: z.array(z.string()).default([]),
  work_location: z.enum(['remote', 'in_person', 'hybrid']).nullable(),
  employment_type: z.preprocess(
    (val) => val === null || val === '' ? 'full_time' : val,
    z.enum(['full_time', 'part_time', 'co_op', 'internship', 'contract']).default('full_time')
  ).optional(),
  is_active: z.boolean().default(true),
});

export const simplifiedJobSchema = z.object({
    company_name: z.string().optional(),
    position_title: z.string().optional(),
    job_url: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    salary_range: z.string().nullable().optional(),
    keywords: z.array(z.string()).default([]).optional(),
    work_location: z.preprocess(
      (val) => {
        let processedVal = val;
        if (Array.isArray(processedVal) && processedVal.length > 0 && typeof processedVal[0] === 'string') {
          processedVal = processedVal[0];
        }
        // Ensure processedVal is a string before trimming and checking if empty
        if (typeof processedVal === 'string') {
          if (processedVal.trim() === '') return null; // Handle empty string by returning null
          return processedVal; // Return the non-empty string for further processing
        }
        return null; // Return null for other unexpected types or if val was initially null/undefined
      },
      z.string().transform(str => str.toLowerCase()).pipe(z.enum(['remote', 'in_person', 'hybrid']))
    ).nullable().optional(),
    employment_type: z.preprocess(
      (val) => {
        if (typeof val === 'string') {
          if (val.trim() === '') return null; // Handle empty string by returning null
          const lowerVal = val.toLowerCase();
          if (lowerVal === 'contractor') {
            return 'contract';
          }
          return lowerVal;
        }
        return null; // Return null for other unexpected types or if val was initially null/undefined
      },
      z.string().pipe(z.enum(['full_time', 'part_time', 'co_op', 'internship', 'contract']))
    ).nullable().optional(), // Added nullable here to match the behavior of returning null for empty strings
    is_active: z.boolean().default(true).optional(),
  });
  
// Schema specifically for the AI's output when tailoring a resume.
// Sections are now required to encourage the AI to generate them.
export const simplifiedResumeSchema = z.object({
    target_role: z.string().describe("The specific job title the resume is tailored for (e.g., AI Infrastructure Engineer). This MUST be populated."),
    work_experience: z.array(workExperienceSchema).describe("Array of work experience objects, tailored to the target role."),
    education: z.array(educationSchema).describe("Array of education objects."),
    skills: z.array(skillSchema).describe("Array of skill objects, highlighting relevant skills for the target role."),
    projects: z.array(projectSchema).describe("Array of project objects, showcasing relevant experience for the target role."),
    professional_summary: z.string().optional().describe("A brief professional summary (around 3-5 sentences) tailored for the target role, highlighting key experiences and skills relevant to the job description."),
  }).describe("A structured representation of a resume tailored for a specific job role, focusing on work experience, education, skills, projects, and a professional summary relevant to that role.");

// Add type inference helper
export type Job = {
  id?: string;
  company_name?: string;
  position_title?: string;
  job_url?: string | null;
  description?: string | null;
  location?: string | null;
  salary_range?: string | null;
  created_at?: string;
  updated_at?: string;
  keywords?: string[];
  work_location?: 'remote' | 'in_person' | 'hybrid' | null;
  employment_type?: 'full_time' | 'part_time' | 'co_op' | 'internship' | 'contract';
  is_active?: boolean;
};
export type SalaryRange = string | null;

// Work Experience Bullet Points Analysis Schema
export const workExperienceBulletPointsSchema = z.object({
  points: z.array(z.string().describe("A bullet point describing a work achievement or responsibility")),
  analysis: z.object({
    impact_score: z.number().min(1).max(10).describe("Score indicating the overall impact of these achievements (1-10)"),
    improvement_suggestions: z.array(z.string().describe("A suggestion for improvement"))
  }).optional()
});

// Project Analysis Schema
export const projectAnalysisSchema = z.object({
  points: z.array(z.string().describe("A bullet point describing a project achievement or feature")),
  analysis: z.object({
    impact_score: z.number().min(1).max(10).describe("Score indicating the overall impact of these achievements (1-10)"),
    improvement_suggestions: z.array(z.string().describe("A suggestion for improvement"))
  }).optional()
});

// Work Experience Items Schema
export const workExperienceItemsSchema = z.object({
  work_experience_items: z.array(z.object({
    company: z.string().describe("The name of the company where the work experience took place"),
    position: z.string().describe("The job title or position held during the work experience"),
    location: z.string().describe("The location of the company"),
    date: z.string().describe("The date or period during which the work experience occurred"),
    description: z.array(z.string()).describe("A list of responsibilities and achievements during the work experience"),
    technologies: z.array(z.string()).describe("A list of technologies used during the work experience")
  }))
});

// Add type inference helpers for new schemas
export type WorkExperienceBulletPoints = z.infer<typeof workExperienceBulletPointsSchema>;
export type ProjectAnalysis = z.infer<typeof projectAnalysisSchema>;
export type WorkExperienceItems = z.infer<typeof workExperienceItemsSchema>;

// Add to existing zod schemas in this file
export const resumeScoreSchema = z.object({
  overallScore: z.object({
    score: z.number().min(0).max(100),
    reason: z.string()
  }),
  completeness: z.object({
    contactInformation: z.object({
      score: z.number().min(0).max(100),
      reason: z.string()
    }),
    detailLevel: z.object({
      score: z.number().min(0).max(100),
      reason: z.string()
    })
  }),
  impactScore: z.object({
    activeVoiceUsage: z.object({
      score: z.number().min(0).max(100),
      reason: z.string()
    }),
    quantifiedAchievements: z.object({
      score: z.number().min(0).max(100),
      reason: z.string()
    })
  }),
  roleMatch: z.object({
    skillsRelevance: z.object({
      score: z.number().min(0).max(100),
      reason: z.string()
    }),
    experienceAlignment: z.object({
      score: z.number().min(0).max(100),
      reason: z.string()
    }),
    educationFit: z.object({
      score: z.number().min(0).max(100),
      reason: z.string()
    })
  }),
  miscellaneous: z.record(
    z.union([z.number(), z.object({
      score: z.number().min(0).max(100).optional(),
      reason: z.string().optional()
    })]).optional()
  ).optional(),
  overallImprovements: z.array(z.string())
});

export type ResumeScoreMetrics = z.infer<typeof resumeScoreSchema>;
