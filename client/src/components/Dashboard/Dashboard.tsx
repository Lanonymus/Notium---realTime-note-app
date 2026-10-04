import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  Compass,
  UserRound,
  Menu,
  Search,
  ArrowLeft,
  ChevronDown,
  Plus,
  NotebookPen,
  Mic,
  Headphones,
  Settings,
  Info,
  MessageCircleQuestionMark,
  LogOut,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import ProjectComposer from "./ProjectComposer";
import PremiumPaywall from "./PremiumPaywall";
import SettingsPage from "./Settings/SettingsPage";
import YouDashboard from "./YouDashboard";
import RecentSessionItem from "./RecentSessionItem";
import { ProjectCard } from "./ProjectCard";
import DashboardArt, { type ArtKind } from "./DashboardArt";
import {
  Modal,
  PremiumCard,
  RankCard,
  StreakCard,
  StreakDetails,
} from "./DashboardWidgets";
import {
  type DashboardProps,
  type Project,
  type ResourceKind,
} from "./dashboard.types";
import { useDashboardData } from "./useDashboardData";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";

type Tab = "home" | "explore" | "you";

const tabs = [
  { id: "home" as const, label: "Home", icon: Home },
  { id: "explore" as const, label: "Explore", icon: Compass },
  { id: "you" as const, label: "You", icon: UserRound },
];


export default function Dashboard({
  apiBaseUrl = "http://localhost:8000",
  onUpgrade,
  onCreateBlank,
  onOpenProject,
}: DashboardProps = {}) {
  const navigate = useNavigate();
  const data =  useDashboardData(apiBaseUrl, (id) =>
    navigate(`/project/${id}/notes`),
  );

  const [tab, setTab] = useState<Tab>("home");
  const [dialog, setDialog] = useState<"streak" | "premium" | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recent");
  const scope = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);



  const lastProject = data.projects[0];
  const recentProjects = data.projects.slice(1, 4);
  const library = useMemo(
    () =>
      data.projects
        .filter((project) =>
          project.title.toLowerCase().includes(query.toLowerCase()),
        )
        .sort((a, b) =>
          sort === "name"
            ? a.title.localeCompare(b.title)
            : (Date.parse(b.updatedAt) || 0) - (Date.parse(a.updatedAt) || 0),
        ),
    [data.projects, query, sort],
  );

  // Native menus remain keyboard accessible; close on Escape and outside clicks.
  useEffect(() => {
    const closeMenus = (event: PointerEvent | KeyboardEvent) => {
      scope.current
        ?.querySelectorAll<HTMLDetailsElement>("details[open]")
        .forEach((menu) => {
          if (event instanceof KeyboardEvent) {
            if (event.key === "Escape") {
              menu.open = false;
              menu.querySelector<HTMLElement>("summary")?.focus();
            }
          } else if (!menu.contains(event.target as Node)) menu.open = false;
        });
    };
    document.addEventListener("pointerdown", closeMenus);
    document.addEventListener("keydown", closeMenus);
    return () => {
      document.removeEventListener("pointerdown", closeMenus);
      document.removeEventListener("keydown", closeMenus);
    };
  }, []);

  

  function openProject(project: Project, resource: ResourceKind = "notes") {
    if (onOpenProject) onOpenProject(project, resource);
    
    else navigate(`/project/${project.id}/${resource}`);
  }
  
  function upgrade() {
    setDialog("premium");
  }
  function changeTab(next: Tab) {
    setSettingsOpen(false);
    setTab(next);
    setShowAll(false);
  }

  return (
    <div
      ref={scope}
      className="notium-home @container/home min-h-dvh w-full bg-neutral-50 text-[#111] font-[Inter,ui-sans-serif,sans-serif] text-[15px] leading-[1.45] antialiased [&_[hidden]]:!hidden [&_button]:cursor-pointer [&_button:disabled]:cursor-not-allowed [&_button:disabled]:opacity-55 [&_summary]:list-none [&_summary]:cursor-pointer [&_summary::-webkit-details-marker]:hidden [&_:is(button,summary,input,textarea,select):focus-visible]:outline-3 [&_:is(button,summary,input,textarea,select):focus-visible]:outline-[#4866ff] [&_:is(button,summary,input,textarea,select):focus-visible]:outline-offset-4 motion-reduce:[&_*]:!animate-none motion-reduce:[&_*]:!transition-none"
    >
      <header className="nh-header h-[76px] border-b border-[#e5e5e5] bg-white shadow-[0_3px_8px_#00000006] @max-[720px]/home:h-[118px]">
        <div className="nh-header-inner mx-auto flex h-full max-w-[1720px] items-center gap-10 px-8 @max-[1250px]/home:gap-7 @max-[1250px]/home:px-6 @max-[1050px]/home:gap-[25px] @max-[720px]/home:flex-wrap @max-[720px]/home:content-between @max-[720px]/home:gap-0 @max-[720px]/home:px-[18px]">
          
          <button
            type="button"
            className="nh-wordmark border-0 bg-transparent p-0 text-[34px] font-[750] tracking-[-1.8px] text-[#080808] @max-[720px]/home:mt-[9px] @max-[720px]/home:text-[28px]"
            onClick={() => changeTab("home")}
            aria-label="Notium home"
          >
            Notium
          </button>

          <nav
            aria-label="Main navigation"
            className="nh-tabs flex gap-7 self-stretch @max-[1050px]/home:gap-5 @max-[720px]/home:order-3 @max-[720px]/home:h-12 @max-[720px]/home:w-full @max-[720px]/home:gap-7"
          >
            {tabs.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`nh-tab relative flex items-center gap-[9px] border-0 bg-transparent px-px text-[16px] text-[#737373] font-[400]
                   @max-[1050px]/home:gap-[7px] @max-[1050px]/home:text-[14px]
                    @max-[720px]/home:text-[15px] ${tab === item.id ? "font-[600] text-gray-900" : ""}`}
                aria-current={tab === item.id ? "page" : undefined}
                onClick={() => changeTab(item.id)}
              >
                <item.icon
                  size={19}
                  strokeWidth={tab === item.id ? 2.3 : 1.6}
                />
                <span>{item.label}</span>
                {tab === item.id && (
                  <motion.span
                    className="nh-tab-line absolute inset-x-0 bottom-0 h-[3px] rounded-t-[3px] bg-[#111]"
                    layoutId="notium-home-active-tab"
                    transition={{
                      duration: reduceMotion ? 0 : 0.2,
                      ease: "easeOut",
                    }}
                  />
                )}
              </button>
            ))}
          </nav>

          <div className="nh-header-actions ml-auto flex items-center gap-3 @max-[1050px]/home:gap-[7px] @max-[720px]/home:mt-2">
            
            <button
              type="button"
              className="nh-premium-outline whitespace-nowrap rounded-full border-0 bg-gray-200 p-[2px]
               [&>span]:block [&>span]:rounded-[inherit] [&>span]:bg-white [&>span]:px-[17px] [&>span]:py-[9px] [&>span]:text-[14px]
                [&>span]:text-[#111] hover:[&>span]:bg-gray-50 @max-[1050px]/home:[&>span]:px-[11px] @max-[1050px]/home:[&>span]:text-[12px]
                 @max-[720px]/home:hidden"
              onClick={upgrade}
            >
              <span className="">Go Premium</span>
            </button>

            <details className="nh-menu relative open:z-10 nh-keys-menu">
              <summary
                className="nh-counter flex h-[46px] min-w-20 items-center justify-center gap-[3px] rounded-full border-2 border-[#e5e5e5] bg-white px-4 py-1 text-[#111] [&>span]:text-[23px] [&>span]:font-bold [&>span]:leading-none [&>.nh-art]:h-[31px] [&>.nh-art]:w-[26px] @max-[1050px]/home:min-w-[62px] @max-[1050px]/home:px-[11px] @max-[720px]/home:h-[39px] @max-[720px]/home:min-w-[54px] @max-[720px]/home:px-2 @max-[720px]/home:py-[3px] @max-[720px]/home:[&>span]:text-[19px] @max-[720px]/home:[&>.nh-art]:h-[27px] @max-[720px]/home:[&>.nh-art]:w-[23px]"
                aria-label="Your daily keys"
              >
                <span>{data.keysLeft ?? 0}</span>
                <DashboardArt kind="key" />
              </summary>

              <div className="nh-keys-popover absolute top-[calc(100%+16px)] right-[-30px] w-80 rounded-xl border border-[#eee] bg-white p-5 text-center shadow-[0_6px_20px_#00000012] before:absolute before:-top-[7px] before:right-[61px] before:size-3 before:rotate-45 before:border-t before:border-l before:border-[#eee] before:bg-white before:content-[''] [&>strong]:block [&>strong]:text-[17px] [&>p]:mt-2 [&>p]:mb-[21px] [&>p]:text-[13px] [&>p]:text-[#777] @max-[720px]/home:fixed @max-[720px]/home:inset-x-4 @max-[720px]/home:top-[66px] @max-[720px]/home:ml-auto @max-[720px]/home:w-auto @max-[720px]/home:max-w-[350px] @max-[720px]/home:before:hidden">
                <div className="nh-key-total mb-[13px] flex items-center justify-center gap-1 text-[57px] leading-none font-[750] [&>.nh-art]:h-[79px] [&>.nh-art]:w-[61px]">
                  {data.keysLeft ?? 0}
                  <DashboardArt kind="key" />
                </div>
                <strong>
                  {data.keysLeft !== undefined
                    ? `You have ${data.keysLeft} key${data.keysLeft === 1 ? "" : "s"}`
                    : "Your daily learning keys"}
                </strong>
                <p>
                  {data.keysLeft !== undefined
                    ? "On free plan you get 1 free key per day."
                    : "Your balance will appear when available."}
                </p>

                <button
                  type="button"
                  className="mt-6 flex gap-2 justify-center items-center min-h-[52px] w-full rounded-full border-b-[4px] border-black active:border-b-0 select-none
                    bg-[linear-gradient(110deg,#363636,#292929)] px-6 py-3 text-[16px]  text-white transition-[transform,filter]
                    hover:brightness-110 active:translate-y-[3px] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2
                    focus-visible:outline-offset-4 focus-visible:outline-blue-600 font-[500]"
                  onClick={upgrade}
                >
                  {/* Obszar przycinający blask */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]"
                  >
                    <motion.span
                      className="absolute inset-y-[-40%] w-[28%] -skew-x-[20deg]
                        bg-gradient-to-r from-transparent via-white/35 to-transparent
                        blur-[1px]"
                      initial={{ left: "-45%" }}
                      animate={{ left: "120%" }}
                      transition={{
                        duration: 0.85,
                        ease: "easeInOut",
                        repeat: Infinity,
                        repeatDelay: 4.15,
                      }}
                    />
                  </span>

                  <span className="relative z-10">Explore Premium</span>
                </button>

              </div>

            </details>
            <button
              type="button"
              className="nh-counter flex h-[46px] min-w-20 items-center justify-center gap-[3px] rounded-full border-2 border-[#e5e5e5] bg-white px-4 py-1 text-[#111] [&>span]:text-[23px] [&>span]:font-bold [&>span]:leading-none [&>.nh-art]:h-[31px] [&>.nh-art]:w-[26px] @max-[1050px]/home:min-w-[62px] @max-[1050px]/home:px-[11px] @max-[720px]/home:h-[39px] @max-[720px]/home:min-w-[54px] @max-[720px]/home:px-2 @max-[720px]/home:py-[3px] @max-[720px]/home:[&>span]:text-[19px] @max-[720px]/home:[&>.nh-art]:h-[27px] @max-[720px]/home:[&>.nh-art]:w-[23px]"
              onClick={() => setDialog("streak")}
              aria-label={`${data.learningStats.dailyStreak}-day streak`}
            >
              <span>{data.learningStats.dailyStreak}</span>
              <DashboardArt kind="fire" />
            </button>
             
              <DropdownMenu open={isSettingsMenuOpen} onOpenChange={setIsSettingsMenuOpen}>
                <DropdownMenuTrigger render={
                    <div className={`h-fit select-none w-fit p-2 cursor-pointer rounded-[12px] ${isSettingsMenuOpen ? "bg-gray-100" : ""}`} >
                      <Menu size={25} />
                    </div>
                }/>
                <DropdownMenuContent 
                  align="start" 
                  sideOffset={10} 
                  className="!border-1 px-0 w-[200px] [&_svg]:text-gray-700"
                >
                  <DropdownMenuGroup className="">
                    <DropdownMenuItem 
                        onClick={() => {
                          setSettingsOpen(true);
                          setIsSettingsMenuOpen(false);
                        }}
                        className="flex pl-2 gap-2 items-center rounded-none py-3 text-[15px] text-gray-600"
                      >
                      <Settings />                        
                      Settings                        
                    </DropdownMenuItem> 
                  </DropdownMenuGroup>

                  <DropdownMenuSeparator className="h-[2px] bg-gray-200"/>                      

                  <DropdownMenuGroup className="">

                    <DropdownMenuItem 
                        // onClick={() => pick("application/pdf")}
                        className="flex pl-2 gap-2 items-center rounded-none py-3 text-[15px] text-gray-600"
                      >
                     <Info />                        
                      About                        
                    </DropdownMenuItem>        

                    <DropdownMenuItem 
                        // onClick={() => pick("application/pdf")}
                        className="flex pl-2 gap-2 items-center rounded-none py-3 text-[15px] text-gray-600"
                      >
                      <MessageCircleQuestionMark />                        
                      Help                        
                    </DropdownMenuItem>                                                 
                  </DropdownMenuGroup> 

                  <DropdownMenuSeparator className="h-[2px] bg-gray-200"/>      

                  <DropdownMenuGroup className="">
                    <DropdownMenuItem 
                        // onClick={() => pick("application/pdf")}
                        className="flex pl-2 gap-2 items-center rounded-none py-3 text-[15px] text-gray-600"
                      >
                      <LogOut />                        
                      Log out                        
                    </DropdownMenuItem>                                                    
                  </DropdownMenuGroup>                           
                </DropdownMenuContent>

              </DropdownMenu>   

          </div>
        </div>
      </header>

      {settingsOpen ? (
        <SettingsPage onBack={() => setSettingsOpen(false)} onUpgrade={upgrade} />
      ) : (
        <>
      {/* Kept mounted so changing tabs does not lose text, uploads or extraction state. */}
      <main
        className="nh-main mx-auto max-w-[1720px] px-8 pt-[58px] pb-12 @max-[1250px]/home:px-6 @max-[1250px]/home:py-[38px] @max-[720px]/home:px-[18px] @max-[720px]/home:py-[30px]"
        hidden={tab !== "home"}
        aria-label="Home dashboard"
      >
        <div
          className="nh-home-layout grid grid-cols-[minmax(260px,.88fr)_minmax(440px,1.74fr)_minmax(300px,1.04fr)]
           items-start gap-[clamp(24px,2.2vw,40px)] @max-[1250px]/home:grid-cols-[245px_minmax(0,1fr)_280px]
            @max-[1250px]/home:gap-5 @max-[1050px]/home:grid-cols-[minmax(240px,.85fr)_minmax(320px,1.15fr)]
             @max-[1050px]/home:gap-6 @max-[720px]/home:flex @max-[720px]/home:flex-col @max-[720px]/home:gap-[23px]"
          hidden={showAll}
        >
          <aside
            style={{ animationDelay: `${0.5}s`}}
            className="nh-left-rail flex min-w-0 flex-col gap-5 @max-[720px]/home:order-2 @max-[720px]/home:w-full animate-from-left"
            aria-label="Your learning activity"
          >
            <StreakCard stats={data.learningStats} onOpen={() => setDialog("streak")} />
            <PremiumCard onUpgrade={upgrade} />
            <RankCard stats={data.learningStats} />
          </aside>

            {/* Spersonalizowane powitanie */}
            {/* Oryginalny komponent */}
            <ProjectComposer data={data} onCreateBlank={onCreateBlank} />


          {/* Prawe widżety */}
          <aside
            style={{ animationDelay: `${0.5}s`}}          
            className="nh-right-rail animate-from-right flex min-w-0 flex-col gap-5 @max-[720px]/home:order-1 @max-[720px]/home:w-full"
            aria-label="Your projects"
          >
            {data.loadingProjects ? (
              <div
                className="nh-card rounded-[17px] border-2 border-[#e5e5e5] bg-white p-[22px] @max-[1250px]/home:p-[17px]
                 @max-[1050px]/home:p-[22px] @max-[720px]/home:p-5 nh-loading-card flex min-h-[425px]
                  flex-col gap-[15px] [&>div]:h-[23px] [&>div]:w-[65%] [&>div]:rounded-[7px]
                   [&>div]:bg-[#f3f3f3] motion-safe:[&>div]:animate-pulse [&>div:nth-child(2)]:h-[15px]
                    [&>div:nth-child(2)]:w-[43%] [&>span]:my-[15px] [&>span]:flex-1 [&>span]:rounded-xl
                     [&>span]:bg-[#f7f7f7] [&>div:last-child]:h-[46px] [&>div:last-child]:w-full [&>div:last-child]:rounded-[25px]"
                role="status"
                aria-label="Loading projects"
              >
                <div />
                <div />
                <span />
                <div />
              </div>
            ) : data.projectsError ? (
              
              <section className="nh-card rounded-[17px] border-2 border-[#e5e5e5] bg-white px-5 py-[25px] @max-[1250px]/home:p-[17px] @max-[1050px]/home:p-[22px] @max-[720px]/home:p-5 nh-empty-projects text-center [&>.nh-art]:mx-auto [&>.nh-art]:mb-4 [&>.nh-art]:h-[95px] [&>.nh-art]:w-[90px] [&_h2]:text-[20px] [&_h2]:tracking-[-.5px] [&_p]:mt-3 [&_p]:mb-5 [&_p]:text-[14px] [&_p]:text-[#777]">
                <p role="alert">{data.projectsError} - check wifi connection</p>
                <button
                  type="button"
                  className="nh-secondary rounded-full border-2 border-[#e5e5e5] bg-white px-[18px] py-[10px] text-[14px] font-[550] hover:bg-[#f6f6f6]"
                  onClick={() => void data.loadUserData()}
                >
                  Try again
                </button>
              </section>

            ) : lastProject ? (
              <RecentSessionItem
                key={lastProject.id}
                title={lastProject.title}
                resources={lastProject.resources}
                onOpenSession={() => openProject(lastProject)}
                onOpenResource={(resource) =>
                  openProject(lastProject, resource)
                }
                icon={lastProject.icon}
              />
            ) : (
              <section className="nh-card rounded-[17px] border-2 border-[#e5e5e5] bg-white px-5 py-[25px] @max-[1250px]/home:p-[17px]
               @max-[1050px]/home:p-[22px] @max-[720px]/home:p-5 nh-empty-projects text-center [&>.nh-art]:mx-auto
                [&>.nh-art]:mb-4 [&>.nh-art]:h-[95px] [&>.nh-art]:w-[90px] 
                 [&_p]:mt-3 [&_p]:mb-8 [&_p]:text-[14px] [&_p]:text-[#777] ">
                
                <div className="relative w-fit h-fit mx-auto">
                  <img src="/doodles/doodle_6.png" alt="" className="w-[70px] h-auto mb-8 grayscale opacity-60 " />
                </div>

                <h2 className="text-gray-800 text-[20px] font-[700]">No projects yet</h2>
                <p className="flex items-start gap-2 text-center">
                  {/* <span className="mt-[8px] w-1 h-1 rounded-full bg-gray-400 shrink-0" /> */}
                  <span>
                    Add a pdf file or youtube link, an image or any source of data to create project.
                  </span>
                </p>

                <button
                  type="button"
                  className="nh-secondary rounded-full border-2 shadow-[1px_2px_0px_#e5e5e5] active:shadow-none border-[#e5e5e5]
                   active:translate-y-[3px] bg-white px-[18px] py-[10px] text-[14px] font-[550] hover:bg-[#f6f6f6]"
                  onClick={() =>
                    scope.current
                      ?.querySelector<HTMLTextAreaElement>(
                        ".nh-prompt textarea",
                      )
                      ?.focus()
                  }
                >
                  Create your first project
                </button>
              </section>
            )}
            {!data.loadingProjects &&
              !data.projectsError &&
              data.projects.length > 0 && (
                <section className="nh-card rounded-[17px] border-2 border-[#e5e5e5] bg-white px-[17px] pt-[17px] pb-3 @max-[1250px]/home:p-[17px] @max-[1050px]/home:p-[22px] @max-[720px]/home:p-5 nh-recent-projects ">
                  <div className="nh-section-heading mb-[9px] flex items-center justify-between gap-3 [&_h2]:text-[18px] [&_h2]:font-[650] [&_h2]:tracking-[-.4px]">

                    <h2>Recent projects</h2>

                    <button
                      type="button"
                      className="nh-text-button border-0 bg-transparent px-0 py-1 text-[13px] font-[550] whitespace-nowrap text-[#456dff] hover:underline"
                      onClick={() => setShowAll(true)}
                    >
                      See all
                    </button>

                  </div>
                  {recentProjects.length > 0 ? (
                    recentProjects.map((project, index) => (
                      <ProjectCard
                        key={project.id}
                        {...project}
                        onSelectSession={() => openProject(project)}
                        onOpenResource={(resource) =>
                          openProject(project, resource)
                        }
                      />
                    ))
                  ) : (
                    <p className="nh-muted text-[#888] nh-small py-2 text-[13px]">
                      Your other projects will appear here.
                    </p>
                  )}
                </section>
              )}
          </aside>


        </div>
        {showAll && (
          <section className="nh-library mx-auto max-w-[1000px] [&_h1]:text-[28px] [&_h1]:font-[650] [&_h1]:tracking-[-1px] [&_h1>span]:ml-[7px] [&_h1>span]:text-[16px] [&_h1>span]:text-[#888]">
            
            <button
              type="button"
              className="nh-back mb-[30px] inline-flex items-center gap-2 border-0 bg-transparent p-0 text-[#777]"
              onClick={() => setShowAll(false)}
            >
              <ArrowLeft size={18} />
              Back to Home
            </button>
            
            <div className="nh-library-heading mb-[25px] flex items-center justify-between gap-5 @max-[720px]/home:flex-col @max-[720px]/home:items-stretch">
              
              <h1 className="flex justify-center items-center gap-2">
                Your projects <span className="mt-[5px] !text-[22px]">{data.projects.length}</span>
              </h1>

              <div className="nh-library-tools flex gap-[10px] @max-[720px]/home:flex-wrap">
                <label className="nh-library-search flex items-center gap-2 rounded-[10px] border-2 border-[#e5e5e5] px-3 py-[9px]
                 text-[#777] [&_input]:w-40 [&_input]:min-w-0 [&_input]:border-0 [&_input]:bg-transparent [&_input]:text-[13px]
                  [&_input]:text-[#333] @max-[720px]/home:flex-1 @max-[720px]/home:[&_input]:w-full">
                  <Search size={17} />
                  <input
                    aria-label="Search projects"
                    placeholder="Search projects…"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </label>

                <label className="nh-library-sort flex items-center gap-2 rounded-[10px] border-2 border-[#e5e5e5] px-3 py-[9px] text-[#777]
                 [&_select]:appearance-none [&_select]:border-0 [&_select]:bg-transparent [&_select]:text-[13px] [&_select]:text-[#555]">
                  <select
                    aria-label="Sort projects"
                    value={sort}
                    onChange={(event) => setSort(event.target.value)}
                  >
                    <option value="recent">Most recent</option>
                    <option value="name">Name A–Z</option>
                  </select>
                  <ChevronDown size={15} />
                </label>
              </div>

            </div>

            <div className="nh-library-list grid grid-cols-2 gap-[15px] [&>.nh-project-row]:rounded-[15px] [&>.nh-project-row]:border-2
             [&>.nh-project-row]:border-gray-200 [&>.nh-project-row]:bg-transparent [&>.nh-project-row]:hover:bg-gray-100  [&>.nh-project-row]:p-3 @max-[720px]/home:grid-cols-1">
              {library.map((project, index) => (
                <ProjectCard
                  key={project.id}
                  {...project}
                  onSelectSession={() => openProject(project)}
                  onOpenResource={(resource) => openProject(project, resource)}
                />
              ))}
            </div>

            {!library.length && (
              <p className="nh-muted text-[#888]">
                No projects match “{query}”.
              </p>
            )}
          </section>
        )}
      </main>
      {tab === "explore" && (
        <main
          className="nh-empty-tab min-h-[calc(100dvh-76px)] @max-[720px]/home:min-h-[calc(100dvh-118px)]"
          aria-label="Explore"
        />
      )}
      {tab === "you" && (
        <YouDashboard
          activeDates={data.learningStats.activeDates}
        />
      )}
      <Modal
        open={dialog === "streak"}
        title="Daily streak"
        className="nh-streak-dialog w-[min(600px,calc(100vw-32px))]! p-8! @max-[720px]/home:p-[22px]! [&_.nh-dialog-heading]:mb-[35px] [&_.nh-dialog-heading_h2]:text-[29px] [&_.nh-streak-number]:text-[76px] [&_.nh-streak-number>.nh-art]:h-[72px] [&_.nh-streak-number>.nh-art]:w-[59px] [&_.nh-freezes>.nh-art]:h-[65px] [&_.nh-freezes>.nh-art]:w-[56px] [&_.nh-day-circle]:max-w-16 [&_.nh-day-circle>.nh-art]:h-[43px] [&_.nh-day-circle>.nh-art]:w-[37px] [&_.nh-day]:text-[18px] @max-[720px]/home:[&_.nh-dialog-heading_h2]:text-[25px] @max-[720px]/home:[&_.nh-streak-number]:text-[62px] @max-[720px]/home:[&_.nh-freezes>.nh-art]:h-[50px] @max-[720px]/home:[&_.nh-freezes>.nh-art]:w-[39px] @max-[720px]/home:[&_.nh-streak-message]:text-[17px]"
        onClose={() => setDialog(null)}
      >
        <StreakDetails stats={data.learningStats} />
      </Modal>
        </>
      )}
      <PremiumPaywall
        open={dialog === "premium"}
        onClose={() => setDialog(null)}
        onSubscribe={onUpgrade ? () => onUpgrade() : undefined}
      />
    </div>
  );
}
