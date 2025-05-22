import { v4 as uuidv4 } from 'uuid';
import { simplifiedResumeSchema, workExperienceSchema as AIWorkExperienceSchema, projectSchema as AIProjectSchema, skillSchema as AISkillSchema, educationSchema as AIEducationSchema } from '@/lib/zod-schemas';
import { WorkExperience, Project, Skill, Education, DescriptionPoint, Resume as FrontendResume } from '@/lib/types';
import { z } from 'zod';

// Helper type for the AI output structure after parsing with simplifiedResumeSchema
type AIResumeOutput = z.infer<typeof simplifiedResumeSchema>;

// Define more specific types for AI section items based on Zod schemas
type AIWorkExperience = z.infer<typeof AIWorkExperienceSchema>;
type AIProject = z.infer<typeof AIProjectSchema>;
type AISkill = z.infer<typeof AISkillSchema>;
type AIEducation = z.infer<typeof AIEducationSchema>;


// Helper type for the structure we want to pass to createTailoredResume
// This should match the 'tailoredContent' parameter of createTailoredResume
// It's a subset of FrontendResume focusing on AI-generated parts, plus target_role.
export type ProcessedAIContent = Pick<FrontendResume,
  'professional_summary' | 'work_experience' | 'projects' | 'skills' | 'education'
> & { target_role: string }; // target_role is essential from AI output

export function addClientSideIdsToAiResumeOutput(aiData: AIResumeOutput): ProcessedAIContent {
  const processedData: ProcessedAIContent = {
    target_role: aiData.target_role, // Ensure target_role is passed through
    professional_summary: aiData.professional_summary || null,
    work_experience: [],
    projects: [],
    skills: [],
    education: [],
  };

  if (aiData.work_experience) {
    processedData.work_experience = aiData.work_experience.map((exp: AIWorkExperience): WorkExperience => ({
      // Spread AI data, then explicitly add/override ID and transform description
      ...exp,
      id: uuidv4(),
      description: exp.description.map((descContent: string): DescriptionPoint => ({
        id: uuidv4(),
        content: descContent,
      })),
      // Ensure optional fields are handled correctly if they are not in AIWorkExperience but in WorkExperience
      technologies: exp.technologies || [], // Default to empty array if undefined
    }));
  }

  if (aiData.projects) {
    processedData.projects = aiData.projects.map((proj: AIProject): Project => ({
      ...proj,
      id: uuidv4(),
      description: proj.description.map((descContent: string): DescriptionPoint => ({
        id: uuidv4(),
        content: descContent,
      })),
      technologies: proj.technologies || [],
    }));
  }

  if (aiData.skills) {
    processedData.skills = aiData.skills.map((skillCat: AISkill): Skill => ({
      ...skillCat,
      id: uuidv4(),
      items: skillCat.items.map((itemContent: string): DescriptionPoint => ({
        id: uuidv4(),
        content: itemContent,
      })),
    }));
  }
  
  if (aiData.education) {
    processedData.education = aiData.education.map((edu: AIEducation): Education => ({
      ...edu,
      id: uuidv4(),
      field: edu.field || '', // Provide default empty string for field
      date: edu.date || '', // Provide default empty string for date
      achievements: edu.achievements || [], // Default to empty array if undefined
      // GPA might need conversion if AI sends string and Frontend expects number | string
      gpa: edu.gpa, // Assuming type compatibility or further handling if needed
    }));
  }

  return processedData;
}
