'use server';
import { generateObject } from 'ai';
import { z } from 'zod';
import { RESUME_FORMATTER_SYSTEM_MESSAGE } from "@/lib/prompts";
import { initializeAIClient, type AIConfig } from '@/utils/ai-tools';

// RESUME -> PROFILE
export async function formatProfileWithAI(
  userMessages: string,
  config?: AIConfig
) {
    try {
      const aiClient = initializeAIClient(config);
      
      // Log the model being used
      console.log('Using AI Model:', config?.model || 'gpt-4o-mini (default)');

      const { object } = await generateObject({
        model: aiClient,
        schema: z.object({
          content: z.object({
            first_name: z.string().optional(),
            last_name: z.string().optional(),
            email: z.string().optional(),
            phone_number: z.string().optional(),
            location: z.string().optional(),
            website: z.string().optional(),
            linkedin_url: z.string().optional(),
            github_url: z.string().optional(),
            work_experience: z.array(z.object({
              company: z.string(),
              position: z.string(),
              date: z.string(),
              location: z.string().optional(),
              description: z.array(z.string()),
              technologies: z.array(z.string()).optional()
            })).optional(),
            education: z.array(z.object({
              school: z.string(),
              degree: z.string(),
              field: z.string(),
              date: z.string(),
              location: z.string().optional(),
              gpa: z.string().optional(),
              achievements: z.array(z.string()).optional()
            })).optional(),
            skills: z.array(z.object({
              category: z.string(),
              items: z.array(z.string())
            })).optional(),
            projects: z.array(z.object({
              name: z.string(),
              description: z.array(z.string()),
              technologies: z.array(z.string()).optional(),
              date: z.string().optional(),
              url: z.string().optional(),
              github_url: z.string().optional()
            })).optional(),
            certifications: z.array(z.object({
              name: z.string(),
              issuer: z.string(),
              date_acquired: z.string().optional(),
              expiry_date: z.string().optional(),
              credential_id: z.string().optional(),
              url: z.string().optional()
            })).optional()
          })
        }),
        prompt: `Please analyze this resume text and extract all relevant information into a structured profile format. 
                Include all sections (personal info, work experience, education, skills, projects, certifications) if present.
                Ensure all arrays (like description, technologies, achievements) are properly formatted as arrays.
                For any missing or unclear information, use optional fields rather than making assumptions.
  
                Resume Text:
  ${userMessages}`,
        system: RESUME_FORMATTER_SYSTEM_MESSAGE.content as string,
      });

  
    //   console.dir(object.content, { depth: null, colors: true });
      console.log('USING THE MODEL: ', aiClient);
  
      return object.content;
    } catch (error) {
      throw error;
    }
  }