'use server';

import { generateObject, LanguageModelV1 } from 'ai';
import { z } from 'zod';
import { 
  simplifiedJobSchema, 
  simplifiedResumeSchema, 
} from "@/lib/zod-schemas";
import { TAILORED_RESUME_GENERATOR_SYSTEM_MESSAGE } from "@/lib/prompts"; // Added import
import { Job, Resume } from "@/lib/types";
import { AIConfig } from '@/utils/ai-tools';
import { initializeAIClient } from '@/utils/ai-tools';
// import { getSubscriptionPlan } from '../stripe/actions'; // Removed unused import
// import { checkRateLimit } from '@/lib/rateLimiter'; // Removed unused import


export async function tailorResumeToJob(
  resume: Resume, 
  jobListing: z.infer<typeof simplifiedJobSchema>,
  config?: AIConfig
) {
  // const planResult = await getSubscriptionPlan(true); // Removed as id is no longer needed
  // const plan = typeof planResult === 'string' ? planResult : planResult.plan; // Removed unused variable
  // const id = typeof planResult === 'string' ? '' : planResult.id; // Ensure id is a string, default to empty if planResult is string // Removed as id is no longer needed
  // const isPro = plan === 'pro'; // Removed unused variable
  const aiClient = initializeAIClient(config); // Corrected: initializeAIClient only takes config
// Check rate limit
  // await checkRateLimit(id); // Temporarily commented out for local testing

  console.log('[tailorResumeToJob] Initializing AI call...');
  console.log('[tailorResumeToJob] Resume input:', JSON.stringify(resume, null, 2));
  console.log('[tailorResumeToJob] Job listing input:', JSON.stringify(jobListing, null, 2));
  console.log('[tailorResumeToJob] AI Client object:', aiClient); // Log the aiClient to see its structure

try {
    console.log('[tailorResumeToJob] Calling generateObject with full schema...');
    
    // Determine if the client is Gemini to conditionally omit maxTokens
    // This is a heuristic; a more robust way might involve checking aiClient.provider or modelId prefix
    const isGemini = aiClient.modelId?.includes('gemini');

    // Define the specific schema structure for this AI call
    const tailorResumeAISchema = z.object({
      content: simplifiedResumeSchema,
    });

    // Define a more specific type for options using the actual schema type
    type TailorGenerateObjectOptions = {
      model: LanguageModelV1;
      schema: typeof tailorResumeAISchema; // Use the specific schema type
      system: string;
      prompt: string;
      maxTokens?: number;
    };

    const generateObjectOptions: TailorGenerateObjectOptions = {
      model: aiClient as LanguageModelV1,
      schema: tailorResumeAISchema, // Use the defined schema constant
      system: TAILORED_RESUME_GENERATOR_SYSTEM_MESSAGE.content as string, // Use imported system message
prompt: `
    This is the Resume:
    ${JSON.stringify(resume, null, 2)}
    
    This is the Job Description:
    ${JSON.stringify(jobListing, null, 2)}
    `,
    };

    if (!isGemini) {
      // For non-Gemini models (like Claude), we know 4096 is the practical limit we hit.
      generateObjectOptions.maxTokens = 4096;
      console.log('[tailorResumeToJob] Using maxTokens: 4096 for non-Gemini model.');
    } else {
      generateObjectOptions.maxTokens = 32768; // Setting a high maxTokens for Gemini
      console.log('[tailorResumeToJob] Using maxTokens: 32768 for Gemini model.');
    }

    const { object, usage, finishReason } = await generateObject(generateObjectOptions);

    console.log('[tailorResumeToJob] generateObject usage:', usage);
    console.log('[tailorResumeToJob] generateObject finishReason:', finishReason);
    return object.content satisfies z.infer<typeof simplifiedResumeSchema>;
  } catch (error: unknown) { // Changed to unknown for better type safety
    console.error('[tailorResumeToJob] Error during generateObject or processing:', error);
    if (error instanceof Error && error.cause) {
      console.error('[tailorResumeToJob] Error cause:', error.cause);
    }
    // Log additional properties if they exist on the error object
    if (typeof error === 'object' && error !== null) {
      if ('text' in error) console.error('[tailorResumeToJob] Error text:', (error as {text: string}).text);
      if ('response' in error) console.error('[tailorResumeToJob] Error response object:', JSON.stringify((error as Record<string, unknown>).response, null, 2));
      if ('usage' in error) console.error('[tailorResumeToJob] Error usage:', JSON.stringify((error as Record<string, unknown>).usage, null, 2));
      if ('finishReason' in error) console.error('[tailorResumeToJob] Error finishReason:', (error as {finishReason: string}).finishReason);
      if ('digest' in error) console.error('[tailorResumeToJob] Error digest:', (error as {digest: string}).digest);
    }
    throw error;
  }
}

export async function formatJobListing(jobListing: string, config?: AIConfig) {
  // const planResult = await getSubscriptionPlan(true); // Removed as id is no longer needed
  // const plan = typeof planResult === 'string' ? planResult : planResult.plan; // Removed unused variable
  // const id = typeof planResult === 'string' ? '' : planResult.id; // Ensure id is a string, default to empty if planResult is string // Removed as id is no longer needed
  // const isPro = plan === 'pro'; // Removed unused variable, assuming not needed here either
  const aiClient = initializeAIClient(config); // Corrected: initializeAIClient only takes config
// Check rate limit
  // await checkRateLimit(id); // Temporarily commented out for local testing

try {
    const { object } = await generateObject({
      model: aiClient as LanguageModelV1,
      schema: z.object({
        content: simplifiedJobSchema
      }),
      system: `You are an AI assistant specializing in structured data extraction from job listings. You have been provided with a schema
              and must adhere to it strictly. When processing the given job listing, follow these steps:
              IMPORTANT: For any missing or uncertain information, you must return an empty string ("") - never return "<UNKNOWN>" or similar placeholders.

            Read the entire job listing thoroughly to understand context, responsibilities, requirements, and any other relevant details.
            Perform the analysis as described in each TASK below.
            Return your final output in a structured format (e.g., JSON or the prescribed schema), using the exact field names you have been given.
            Do not guess or fabricate information that is not present in the listing; instead, return an empty string for missing fields.
            Do not include chain-of-thought or intermediate reasoning in the final output; provide only the structured results.
            
            For the description field:
            1. Start with 3-5 bullet points highlighting the most important responsibilities of the role.
               - Format these bullet points using markdown, with each point on a new line starting with "• "
               - These should be the most critical duties mentioned in the job listing
            2. After the bullet points, include the full job description stripped of:
               - Any non-job-related content
            3. Format the full description as a clean paragraph, maintaining proper grammar and flow.`,
      prompt: `Analyze this job listing carefully and extract structured information.

              TASK 1 - ESSENTIAL INFORMATION:
              Extract the basic details (company, position, URL, location, salary).
              For the description, include 3-5 key responsibilities as bullet points.

              TASK 2 - KEYWORD ANALYSIS:
              1. Technical Skills: Identify all technical skills, programming languages, frameworks, and tools
              2. Soft Skills: Extract interpersonal and professional competencies
              3. Industry Knowledge: Capture domain-specific knowledge requirements
              4. Required Qualifications: List education, and experience levels
              5. Responsibilities: Key job functions and deliverables

              Format the output according to the schema, ensuring:
              - Keywords as they are (e.g., "React.js" → "React.js")
              - Skills are deduplicated and categorized
              - Seniority level is inferred from context
              - Description contains 3-5 bullet points of key responsibilities
              Usage Notes:

              - If certain details (like salary or location) are missing, return "" (an empty string).
              - Adhere to the schema you have been provided, and format your response accordingly (e.g., JSON fields must match exactly).
              - Avoid exposing your internal reasoning.
              - DO NOT RETURN "<UNKNOWN>", if you are unsure of a piece of data, return an empty string.
              - FORMAT THE FOLLOWING JOB LISTING AS A JSON OBJECT: ${jobListing}`,
    });


    return object.content satisfies Partial<Job>;
  } catch (error: unknown) { // Changed to unknown for better type safety
    console.error('[formatJobListing] Error during generateObject or processing:', error);
    if (error instanceof Error && error.cause) {
      console.error('[formatJobListing] Error cause:', error.cause);
    }
    // Log additional properties if they exist on the error object
    if (typeof error === 'object' && error !== null) {
      if ('text' in error) console.error('[formatJobListing] Error text:', (error as {text: string}).text);
      if ('response' in error) console.error('[formatJobListing] Error response object:', JSON.stringify((error as Record<string, unknown>).response, null, 2));
      if ('usage' in error) console.error('[formatJobListing] Error usage:', JSON.stringify((error as Record<string, unknown>).usage, null, 2));
      if ('finishReason' in error) console.error('[formatJobListing] Error finishReason:', (error as {finishReason: string}).finishReason);
      if ('digest' in error) console.error('[formatJobListing] Error digest:', (error as {digest: string}).digest);
    }
    throw error;
  }
}
