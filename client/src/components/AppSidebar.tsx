import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { BadgeCheck, Bell, ChevronDown, ChevronsUpDown, CreditCard, File, FileText, FolderKanban, Hash, HelpCircle, Home, Layers, LogOut, Music, Plus, Sparkles, User2 } from "lucide-react";
import { isActive } from "@tiptap/core";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Link, useLocation, useParams } from "react-router-dom";


// Tablica z danymi zakładek dla zachowania czystego kodu
const studyNavItems = [
  {
    title: "Notes",
    url: "notes",
    icon: FileText,
    isActive: true // flaga dla aktualnie zaznaczonej zakładki
  },
  {
    title: "Quiz",
    url: "quiz",
    icon: HelpCircle,
  },
  {
    title: "Flashcards",
    url: "flashcards",
    icon: Layers,
  },
  {
    title: "Podcast",
    url: "podcast",
    icon: Music,
  },
  {
    title: "Source",
    url: "source",
    icon: File
  }
]

// dane użytkownika
const userData = {
  name: "Tom Cruise",
  email: "tom.cruise@example.com",
  avatar: "https://github.com/shadcn.png",
}

export function NavUser() {
  const { isMobile } = useSidebar()
}


export function AppSidebar() {
  const params = useParams() 
  const projectID: string | undefined = params.projectID  
  const location = useLocation() // <-- Dodane, aby sprawdzać aktualny URL
  
  return (
    <Sidebar variant="sidebar" collapsible="icon">

      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  {/* 1. Czarny kwadratowy blok z logo */}
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900">
                    <Hash className="size-4 stroke-[2.5]" />
                  </div>

                  {/* 2. Dwuliniowy układ tekstu */}
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold text-neutral-900 dark:text-neutral-100">
                      Notium
                    </span>
                    <span className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                      Workspace
                    </span>
                  </div>

                  {/* 3. Ikona rozwijania góra/dół */}
                  <ChevronsUpDown className="ml-auto size-4 text-neutral-400" />
                </SidebarMenuButton>
              }>
              </DropdownMenuTrigger>

              {/* 4. Zawartość rozwijanego menu */}
              <DropdownMenuContent
                className="w-[var(--anchor-width)] min-w-56 rounded-xl p-1.5"
                side="bottom"
                align="start"
                sideOffset={4}
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs text-neutral-500">Szybkie akcje</DropdownMenuLabel>
                  <DropdownMenuItem className="py-2.5 cursor-pointer rounded-lg">
                    <Plus className="mr-2 size-4" />
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">
                      Nowa notatka
                    </span>
                    <DropdownMenuShortcut className="text-neutral-400">⌘N</DropdownMenuShortcut>
                  </DropdownMenuItem>

                  <DropdownMenuItem className="py-2.5 cursor-pointer rounded-lg">
                    <Layers className="mr-2 size-4" />
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">
                      Stwórz talię fiszek
                    </span>
                    <DropdownMenuShortcut className="text-neutral-400">⌘F</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />

                  <DropdownMenuItem className="py-2.5 cursor-pointer rounded-lg">
                    <FolderKanban className="mr-2 size-4" />
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">
                      Zarządzaj przedmiotami
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>

              </DropdownMenuContent>

            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>



      {/* Główny kontent Sidebaru z zawartością */}
      <SidebarContent className="mt-8">
        <SidebarGroup>
          {/* Podpis grupy */}
          <SidebarGroupLabel>Study</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="flex flex-col gap-1" >
              {studyNavItems.map((item) => {

                const isActive = location.pathname.includes(`/project/${projectID}/${item.url}`)
              
                return (
                  <SidebarMenuItem key={item.title}>  
                    <SidebarMenuButton 
                      className={`py-1 transition-colors ${
                        isActive 
                          ? "bg-blue-50 text-blue-500 dark:bg-blue-900/20 dark:text-blue-400 border-l-2 border-blue-600 rounded-l-none" 
                          : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
                      }`}
                    isActive={isActive} 
                    render={
                      <Link to={`/project/${projectID}/${item.url}`}>
                        <item.icon className="size-4"/>
                        <span>{item.title}</span>
                      </Link>
                    }>

                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>            
            <DropdownMenu>
              {/* Wyzwalacz w stopce - trigger */}     
              <DropdownMenuTrigger render={
                <SidebarMenuButton
                  size="lg"
                  className="data-[state-open]:bg-sidebar-accent data-[state-open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-full">
                    <AvatarImage src={userData.avatar} alt={userData.name}/>
                    <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                  </Avatar>

                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold text-neutral-900 dark:text-neutral-100">
                      {userData.name}
                    </span>
                    <span className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                      {userData.email}
                    </span>
                  </div>

                  <ChevronsUpDown className="ml-auto size-4 text-neutral-400"/>
                </SidebarMenuButton>
              }/>

              {/* Kontent rozwijanego menu */}
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl p-1.5"
                side={"top"}
                align="center"
                sideOffset={8}
              >

                {/*1. PODGLĄD PROFILU NA GÓRZE */}
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2.5 px-1.5 py-2 text-left text-sm">
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage src={userData.avatar} alt={userData.name} />
                        <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                      </Avatar>

                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold text-neutral-900 dark:text-neutral-100">
                          {userData.name}
                        </span>
                        <span className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                          {userData.email}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>

                {/*2. Upgrade to pro  */}
                <DropdownMenuGroup>
                  <DropdownMenuItem className="py-2 cursor-pointer rounded-lg">
                    <Sparkles className="size-4 text-neutral-800 dark:text-neutral-200"/>
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">
                      Upgrade to Pro
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                  {/* 3. Ustawienia konta */}
                <DropdownMenuGroup>
                  <DropdownMenuItem className="py-2 cursor-pointer rounded-lg">
                    <BadgeCheck className="size-4 text-neutral-800 dark:text-neutral-200" />
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">
                      Account
                    </span>
                  </DropdownMenuItem>

                  <DropdownMenuItem className="py-2 cursor-pointer rounded-lg">
                    <CreditCard className="size-4 text-neutral-800 dark:text-neutral-200" />
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">
                      Billing
                    </span>
                  </DropdownMenuItem>

                  <DropdownMenuItem className="py-2 cursor-pointer rounded-lg">
                    <Bell className="size-4 text-neutral-800 dark:text-neutral-200" />
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">
                      Notifications
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>


                <DropdownMenuSeparator />

                {/* 4. Wylogowanie */}
                <DropdownMenuItem className="py-2 cursor-pointer rounded-lg">
                  <LogOut className="size-4 text-neutral-800 dark:text-neutral-200" />
                  <span className="font-medium text-neutral-800 dark:text-neutral-200">
                    Log out
                  </span>
                </DropdownMenuItem>                         
      
                


              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>


    </Sidebar>
  )
}