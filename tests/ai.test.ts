import { tailorResumeToJob } from '../src/utils/actions/jobs/ai'; // Already relative
import { simplifiedResumeSchema, simplifiedJobSchema } from '../src/lib/zod-schemas'; // Already relative
import { z } from 'zod';
import type { AIConfig } from '../src/utils/ai-tools'; // Already relative
import type { Resume } from '../src/lib/types'; // Already relative
import { sampleBaseResumeForTest } from './sample-base-resume'; // Already relative
import { sampleJobDescriptionForTest } from './sample-job-description'; // Already relative

// Use Resume type for input, ensuring all necessary fields are covered.
type ResumeInput = Resume;

// Type for the job description input, inferred from simplifiedJobSchema
type JobDescriptionInput = z.infer<typeof simplifiedJobSchema>;

// process.env.GOOGLE_API_KEY should be loaded by jest.setup.mjs from .env.test

describe('tailorResumeToJob', () => {
  // Use the imported sampleBaseResumeForTest
  const sampleBaseResume: ResumeInput = sampleBaseResumeForTest;

  // Use the imported sampleJobDescriptionForTest
  const sampleJobDescription: JobDescriptionInput = sampleJobDescriptionForTest;

  jest.setTimeout(180000); // 180 seconds

  it('should generate a tailored resume that matches the Zod schema and expected structure', async () => {
    const modelId = 'gemini-2.5-pro-preview-05-06'; // Updated to the specified preview model
    const aiConfig: AIConfig = {
      model: modelId,
      apiKeys: [], // Pass empty array, initializeAIClient will use env vars if available
    };

    const result = await tailorResumeToJob(sampleBaseResume, sampleJobDescription, aiConfig);

    const parseResult = simplifiedResumeSchema.safeParse(result);
    
    if (!parseResult.success) {
      console.error("Zod validation failed for tailored resume output:", JSON.stringify(parseResult.error.errors, null, 2));
    }
    expect(parseResult.success).toBe(true);

    if (parseResult.success) {
      const tailoredResume = parseResult.data;
      // Log the successful output for analysis
      console.log("Tailored Resume Output:", JSON.stringify(tailoredResume, null, 2)); 

      expect(tailoredResume.target_role).toBeTruthy();
      expect(typeof tailoredResume.target_role).toBe('string');
      expect(tailoredResume.target_role.trim()).not.toBe('');

      expect(tailoredResume.work_experience).toBeDefined();
      expect(Array.isArray(tailoredResume.work_experience)).toBe(true);
      tailoredResume.work_experience?.forEach(exp => {
        expect(exp.description).toBeDefined();
        expect(Array.isArray(exp.description)).toBe(true);
        exp.description?.forEach(desc => expect(typeof desc).toBe('string'));
        expect(exp.company).toBeDefined();
        expect(exp.position).toBeDefined();
      });

       expect(tailoredResume.education).toBeDefined();
       expect(Array.isArray(tailoredResume.education)).toBe(true);
       tailoredResume.education?.forEach(edu => {
         expect(edu.achievements).toBeDefined();
         expect(Array.isArray(edu.achievements)).toBe(true);
         edu.achievements?.forEach(ach => expect(typeof ach).toBe('string'));
         expect(edu.school).toBeDefined();
         expect(edu.degree).toBeDefined();
       });

      expect(tailoredResume.projects).toBeDefined();
      expect(Array.isArray(tailoredResume.projects)).toBe(true);
      tailoredResume.projects?.forEach(proj => {
        expect(proj.name).toBeDefined();
        expect(typeof proj.name).toBe('string');
        expect(proj.description).toBeDefined();
        expect(Array.isArray(proj.description)).toBe(true);
        proj.description?.forEach(desc => expect(typeof desc).toBe('string'));
        expect(proj.technologies).toBeDefined();
        expect(Array.isArray(proj.technologies)).toBe(true);
        proj.technologies?.forEach(tech => expect(typeof tech).toBe('string'));
      });

      expect(tailoredResume.skills).toBeDefined();
      expect(Array.isArray(tailoredResume.skills)).toBe(true);
      tailoredResume.skills?.forEach(skill => {
        expect(skill.category).toBeDefined();
        expect(Array.isArray(skill.items)).toBe(true);
        skill.items?.forEach(item => expect(typeof item).toBe('string'));
      });
    }
  });
});
