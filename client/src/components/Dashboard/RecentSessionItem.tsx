import { useState, type ReactNode } from "react";
import { Check } from "lucide-react";
import DashboardArt from "./DashboardArt";
import type { GeneratedResources, Resource, ResourceKind } from "./dashboard.types";
import { LucideIcon } from "./LucideIcon";


import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type Props = {
  icon?: string;
  title: string;
  updatedAt?: string;
  type?: string;
  resources?: GeneratedResources;
  flashcardsMastered?: number;
  totalFlashcards?: number;
  delay?: number;
  onOpenSession: () => void;
  onOpenResource?: (resource: ResourceKind) => void;
};


export default function RecentSessionItem({
  title,
  resources,
  onOpenSession,
  onOpenResource,
  icon
}: Props) {

  const studyMaterials: Resource[] = [
      { value: "notes" as const, label: "Notes", icon: "FileText", isActive: resources?.hasNotes || false},
      { value: "flashcards" as const, label: "Flashcards", icon: "Layers", isActive: resources?.hasFlashcards || false },
      { value: "quiz" as const, label: "Quiz", icon: "HelpCircle", isActive: resources?.hasQuiz || false } 
    ];
  

  return (

    <section
      className="nh-card rounded-[17px] border-2 border-[#e5e5e5] bg-white p-5 @max-[1250px]/home:p-[17px] @max-[1050px]/home:p-[22px] overflow-hidden
       @max-[720px]/home:p-5 nh-continue-card [&_h2]:text-[23px] [&_h2]:font-[650] [&_h2]:tracking-[-.7px] @max-[1250px]/home:[&_h2]:text-[21px]"
      aria-label="Continue learning"
    >
      <h2>Continue learning</h2>

      <p
        className="nh-project-title mt-[2px]! truncate text-[16px] text-[#777]"
        title={title}
      >
        {title}
      </p>

      <div className="nh-course-art mt-[6px] mb-3 grid h-[147px] place-items-center [&>.nh-art]:size-[190px] @max-[1250px]/home:h-[155px]
       @max-[1250px]/home:[&>.nh-art]:size-[170px] @max-[720px]/home:h-[158px] @max-[720px]/home:[&>.nh-art]:size-[175px]">
        {/* <DashboardArt kind="graph" /> */}
        <span className="text-[60px]">
          {icon}
        </span>
      </div>

      <div className="w-[120%] -translate-x-[20px] h-[2px] bg-gray-100 mb-2"/>
      {/* Wyświetlanie materiałów do uczenia się w projekcie */}
      {studyMaterials.map((material, index) => (
        <Tooltip>
          <TooltipTrigger render={
            <div
              key={material.value}
              aria-checked={material.isActive}
              tabIndex={material.isActive ? 0 : -1}
              className={`nh-learning-option  flex min-h-[49px] w-full items-center gap-[13px] rounded-[10px] border-0 
                px-3 py-[1px] text-left text-[14px] text-gray-500 hover:bg-[#fafafa]  [&.is-selected]:font-[550] [&.is-selected]:text-gray-800
                  [&>.nh-art]:h-[52px] [&>.nh-art]:w-[54px] [&.is-selected_.nh-choice-box]:border-[#456dff] [&.is-selected_.nh-choice-box]:bg-[#456dff]
                  [&.is-selected_.nh-choice-box]:text-white ${material.isActive? "is-selected " : "bg-transparent"}`}
            >
              {/* <DashboardArt kind="platform" muted={selected !== choice.value} /> */}
              <LucideIcon name={material.icon} size={19}/>

              <span>{material.label}</span>

              <span className="nh-choice-box ml-auto grid size-[23px] shrink-0 place-items-center rounded-[6px] border-2 border-[#d7d7d7]">
                {material.isActive && <Check size={17} strokeWidth={3} />}
              </span>

            </div>          
          }/>
          <TooltipContent>
            <p>{`This project ${material.isActive ? "has" : "doesn't have"} ${material.label} ${material.isActive ? "" : "yet"}`}</p>
          </TooltipContent>
        </Tooltip>     
      ))} 


      <button
        onClick={() => onOpenSession()}
        type="button"
        className="nh-primary mt-3 flex min-h-12 w-full items-center justify-center rounded-full border-0 border-b-4 border-[#375ce3]
         bg-[#456dff] px-4 py-[9px] font-[650] text-white transition-[background,transform] duration-150 enabled:hover:bg-[#3d5bf3]
          active:translate-y-[2px]"
      >
        Start
      </button>
    </section>
  );
}
