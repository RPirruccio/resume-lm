'use client';

import React, { Suspense, useRef } from "react"; 
import { Resume, Profile, Job } from "@/lib/types"; // Removed unused WorkExperience, ProjectType, EducationType, Skill, SectionKey
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion } from "@/components/ui/accordion";
import { Tabs, TabsContent } from "@/components/ui/tabs";
// DndContext and related imports might be removed if not used at this level anymore
// import {
//   DndContext,
//   closestCenter,
//   KeyboardSensor,
//   PointerSensor,
//   useSensor,
//   useSensors,
//   DragEndEvent,
//   DragStartEvent,
// } from '@dnd-kit/core';
// import {
//   arrayMove,
//   SortableContext,
//   sortableKeyboardCoordinates,
//   verticalListSortingStrategy,
//   useSortable,
// } from '@dnd-kit/sortable';
// import { CSS } from '@dnd-kit/utilities';
import { cn } from "@/lib/utils";
// import { GripVertical } from "lucide-react"; // No longer used here
import { ResumeEditorActions } from "../actions/resume-editor-actions";
import { TailoredJobAccordion } from "../../management/cards/tailored-job-card";
import { BasicInfoForm } from "../forms/basic-info-form";
import ChatBot from "../../assistant/chatbot";
import { CoverLetterPanel } from "./cover-letter-panel";
import {
  WorkExperienceForm,
  EducationForm,
  SkillsForm,
  ProjectsForm,
  DocumentSettingsForm,
} from '../dynamic-components';
import SummaryForm from "../forms/summary-form"; // Import SummaryForm
import { ResumeEditorTabs } from "../header/resume-editor-tabs";
import ResumeScorePanel from "./resume-score-panel";
// import { GripVertical } from "lucide-react"; // No longer used at this top level


interface EditorPanelProps {
  resume: Resume;
  profile: Profile;
  job: Job | null;
  isLoadingJob: boolean;
  onResumeChange: (field: keyof Resume, value: Resume[keyof Resume]) => void;
}

export function EditorPanel({
  resume,
  profile,
  job,
  isLoadingJob,
  onResumeChange,
}: EditorPanelProps) {
  console.log('Initial resume.section_order from props:', resume.section_order); 
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Titles for the forms/sections - can be used if needed inside TabsContent
  // const sectionTitles: { [key in SectionKey]?: string } = {
  //   work_experience: "Work Experience",
  //   projects: "Projects",
  //   education: "Education",
  //   skills: "Skills",
  // };
  
  return (
    <div className="flex flex-col sm:mr-4 relative h-full max-h-full">
      <div className="flex-1 flex flex-col overflow-y-auto"> {/* Changed overflow-scroll to overflow-y-auto */}
        <ScrollArea className="flex-1 sm:pr-2" ref={scrollAreaRef}>
          <div className="relative pb-12">
            <div className={cn(
              "sticky top-0 z-20 backdrop-blur-sm py-4", // Added py-4 for spacing
              resume.is_base_resume ? "bg-purple-50/80" : "bg-pink-100/90 shadow-sm shadow-pink-200/50"
            )}>
              <div className="flex flex-col gap-4 px-4"> {/* Added px-4 */}
                <ResumeEditorActions onResumeChange={onResumeChange} />
              </div>
            </div>

            <div className="px-4"> {/* Added px-4 for content padding */}
              {/* Tailored Job Accordion */}
              <Accordion type="single" collapsible defaultValue="item-1" className="mt-6">
                <TailoredJobAccordion resume={resume} job={job} isLoading={isLoadingJob} />
              </Accordion>

              {/* Tabs for all sections */}
              <Tabs defaultValue="work" className="my-4"> {/* Changed defaultValue to "work" */}
                <ResumeEditorTabs />

                {/* Basic Info Form */}
                <TabsContent value="basic">
                  <BasicInfoForm profile={profile} />
                </TabsContent>

                {/* Professional Summary Form */}
                <TabsContent value="summary">
                  <Suspense fallback={<div className="h-24 bg-muted rounded-md animate-pulse" />}>
                    <SummaryForm
                      initialValue={resume.professional_summary}
                      onUpdate={(value) => onResumeChange('professional_summary', value)}
                    />
                  </Suspense>
                </TabsContent>
                
                {/* Document Settings Form (Non-reorderable) */}
                <TabsContent value="settings">
                  <Suspense fallback={<div className="h-24 bg-muted rounded-md animate-pulse" />}>
                    <DocumentSettingsForm
                      documentSettings={resume.document_settings!}
                      onChange={(_field, value) => onResumeChange('document_settings', value)}
                    />
                  </Suspense>
                </TabsContent>

                {/* Cover Letter (Non-reorderable) */}
                <TabsContent value="cover-letter">
                  <CoverLetterPanel resume={resume} job={job} />
                </TabsContent>

                {/* Resume Score (Non-reorderable) */}
                <TabsContent value="resume-score">
                  <ResumeScorePanel resume={resume} />
                </TabsContent>

                {/* Work Experience Form */}
                <TabsContent value="work">
                  <Suspense fallback={<div className="h-40 bg-muted rounded-md animate-pulse" />}>
                    <WorkExperienceForm
                      experiences={resume.work_experience}
                      onChange={(experiences) => onResumeChange('work_experience', experiences)}
                      profile={profile}
                      targetRole={resume.target_role}
                    />
                  </Suspense>
                </TabsContent>

                {/* Projects Form */}
                <TabsContent value="projects">
                  <Suspense fallback={<div className="h-40 bg-muted rounded-md animate-pulse" />}>
                    <ProjectsForm
                      projects={resume.projects}
                      onChange={(projects) => onResumeChange('projects', projects)}
                      profile={profile}
                    />
                  </Suspense>
                </TabsContent>

                {/* Education Form */}
                <TabsContent value="education">
                  <Suspense fallback={<div className="h-40 bg-muted rounded-md animate-pulse" />}>
                    <EducationForm
                      education={resume.education}
                      onChange={(education) => onResumeChange('education', education)}
                      profile={profile}
                    />
                  </Suspense>
                </TabsContent>

                {/* Skills Form */}
                <TabsContent value="skills">
                  <Suspense fallback={<div className="h-40 bg-muted rounded-md animate-pulse" />}>
                    <SkillsForm
                      skills={resume.skills}
                      onChange={(skills) => onResumeChange('skills', skills)}
                      profile={profile}
                    />
                  </Suspense>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </ScrollArea>
      </div>

      <div className={cn(
        "absolute w-full bottom-0 rounded-lg border", // Removed backtick from border`
        resume.is_base_resume ? "bg-purple-50/50 border-purple-200/40" : "bg-pink-50/80 border-pink-300/50 shadow-sm shadow-pink-200/20"
      )}>
        <ChatBot 
          resume={resume} 
          onResumeChange={onResumeChange}
          job={job}
        />
      </div>
    </div>
  );
}
