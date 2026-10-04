import type { ReactNode } from "react";
import {
  ArrowUpRight,
  MoreVertical,
  FileText,
  Layers,
  CircleHelp,
  Headphones,
} from "lucide-react";
import DashboardArt, { type ArtKind } from "./DashboardArt";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  relativeDate,
  type GeneratedResources,
  type ResourceKind,
} from "./dashboard.types";

export function ResourceBadge({
  icon,
  label,
  active = false,
  count,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  count?: number;
}) {
  return active ? (
    <span className="nh-resource-badge inline-flex items-center gap-1 rounded-[6px] border border-[#e5e5e5] px-[6px] py-[2px] text-[11px] text-[#777]">
      {icon}
      {label}
      {count !== undefined && ` · ${count}`}
    </span>
  ) : null;
}

export function ProjectCard({
  id,
  title,
  updatedAt,
  resources,
  onSelectSession,
  onOpenResource,
  icon
}: {
  id: string;
  icon?: string;
  title: string;
  updatedAt: string;
  type?: string;
  resources?: GeneratedResources;
  delay?: number;
  onSelectSession: () => void;
  onOpenResource?: (resource: ResourceKind) => void;
}) {
  const options = [
    {
      resource: "notes" as const,
      label: "Open notes",
      icon: FileText,
      enabled: true,
    },
    {
      resource: "flashcards" as const,
      label: "Open flashcards",
      icon: Layers,
      enabled: resources?.hasFlashcards,
    },
    {
      resource: "quiz" as const,
      label: "Open quiz",
      icon: CircleHelp,
      enabled: resources?.hasQuiz,
    },
    {
      resource: "podcast" as const,
      label: "Open podcast",
      icon: Headphones,
      enabled: resources?.hasPodcast,
    },
  ];

  const enabledOptions = options.filter((option) => option.enabled)
  
  return (
    <div
      className="nh-project-row flex min-w-0 items-center gap-[2px] rounded-[9px] hover:bg-[#fafafa]"
      data-project-id={id}
    >
      <button
        type="button"
        className="nh-project-open flex min-w-0 flex-1 items-center gap-[11px] border-0 bg-transparent px-0 py-2 text-left
         [&>.nh-art]:h-[47px] [&>.nh-art]:w-[43px] [&>span]:min-w-0 [&_strong]:block [&_strong]:truncate [&_strong]:text-[15px]
          [&_strong]:font-medium [&_strong]:text-[#333] [&_small]:mt-[3px] [&_small]:block [&_small]:text-[12px] [&_small]:text-[#888]"
        onClick={onSelectSession}
      >
        {/* <DashboardArt kind={illustration} /> */}
        <span className="text-[25px]">
          {icon}
        </span>

        <span>
          <strong title={title}>{title}</strong>
          <small>{relativeDate(updatedAt)}</small>
        </span>
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className="nh-icon-button inline-flex size-[38px] items-center justify-center rounded-lg border-0 bg-transparent p-[7px]
               text-[#222] outline-none hover:bg-[#f4f4f4] data-[state=open]:bg-[#f4f4f4]"
              aria-label={`Actions for ${title}`}
            >
              <MoreVertical size={20} />
            </button>
          }
        />

        <DropdownMenuContent
          align="start" 
          alignOffset={0} 
          className="!border-1 !p-[4px]  border-gray-200 w-[170px] [&_svg]:text-gray-700 [&_svg]:stroke-2  font-[450]"
        >
          <DropdownMenuGroup className="!p-0 ">

            {onOpenResource ? (
              enabledOptions.map((option, index) => (
                  <>
                    <DropdownMenuItem
                      key={option.resource}
                      onClick={() => onOpenResource(option.resource)}
                      className={`flex cursor-pointer items-center gap-[12px] rounded-[7px] px-[11px] py-[10px] text-[13px] text-[#333] focus:bg-[#f4f4f4]
                         ${enabledOptions.length > 1 ? index === 0 ? "mb-[4px]" : index === enabledOptions.length - 1 ? "mt-[4px]" : "my-[4px]" : ""}`}
                    >
                      <option.icon size={16} />
                      {option.label}
                    </DropdownMenuItem>
                    {index !== enabledOptions.length - 1 && (
                      <DropdownMenuSeparator className="h-[2px] bg-gray-200 !py-0 !my-0"/>
                    )}
                  </>
                ))
            ) : (
              <DropdownMenuItem
                onClick={onSelectSession}
                className="flex cursor-pointer items-center gap-[10px] rounded-[7px] px-[11px] py-[10px]
                text-[13px] text-[#333] focus:bg-[#f4f4f4]"
              >
                <ArrowUpRight size={16} />
                Open project
              </DropdownMenuItem>
            )}

          </DropdownMenuGroup>
        </DropdownMenuContent>

      </DropdownMenu>
      
    </div>
  );
}
