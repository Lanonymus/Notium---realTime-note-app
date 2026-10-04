import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import TipTapEditor from "@/TiptapEditor";
import { Outlet } from "react-router-dom";

interface ProjectLayoutProps  {
  children?: React.ReactNode
}

export default function ProjectLayout({ children }: ProjectLayoutProps) {
  return (
    <SidebarProvider>
      {/* 1. Lewa strona - Pasek boczny */}
      <AppSidebar />

      {/* 2. Prawa strona - Dynamiczny kontener zmieniający się przy nawigacji */}
     <div className="relative min-w-0 flex-1">
      <Outlet />
    </div>
      

    </SidebarProvider>
  )
}