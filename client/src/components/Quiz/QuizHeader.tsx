import type { ComponentProps, Ref } from 'react';
import { QuizSettingsDialog } from './QuizSettingsDialog';
import { SidebarTrigger } from '../ui/sidebar';
import { Skeleton } from '../ui/skeleton';

const SharpLightning = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className} 
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Perfectly sharp path of a classic lightning bolt */}
    <path d="M13 2L3 14h7v8l11-12h-7V2z" />
  </svg>
);


type QuizHeaderProps = {
  settingsProps: ComponentProps<typeof QuizSettingsDialog>;
  editorTitleRef: Ref<HTMLInputElement> | undefined,
  title: string,
  onSetTitle: (value: string) => void,
  onUpdateTitle: (value: string) => void,
  isDataLoading: boolean  
};

export default function QuizHeader({ 
  settingsProps,
  editorTitleRef,
  title,
  onSetTitle,
  onUpdateTitle,
  isDataLoading
}: QuizHeaderProps) {
  return (
    // <div className="absolute top-3 right-3 z-20 w-fit h-fit flex justify-center items-center">

    //       <QuizSettingsDialog {...settingsProps} />

    //       <div className="w-[2px] h-5  bg-gray-200 mx-3"/>
          
    //       <button className="
    //           flex items-center justify-center gap-2.5 
    //           px-3 py-[9px]  bg-blue-600 hover:bg-blue-500 
    //           rounded-[7px] cursor-pointer
    //           transition-all duration-200 active:scale-[0.97]
    //       ">
    //           <SharpLightning className="w-[18px] h-[18px] text-white" />

    //           <span className="text-white text-[12px]  font-medium tracking-wide">
    //               Upgrade to Pro
    //           </span>
    //       </button> 
    //   </div>

    <header className="sticky top-0 z-30 border-b border-[#e5e7eb]/80 bg-white backdrop-blur-xl">
        <div className="h-[64px] px-6 lg:px-8 flex items-center justify-between">

            {/* GUZIK DO WŁĄCZANIA SIDE BARA */}
            <div className="flex justify-start items-center">
                <SidebarTrigger size="icon-lg" className="p-0 m-0"/>
                <div className="h-4 w-[1px] bg-gray-200 ml-1 mr-2 "/>

                {isDataLoading ? (
                    <div className="w-full h-full flex items-center justify-start">
                        <Skeleton className="h-8 w-[215px]" />
                    </div>   
                ) : (
                <input 
                    type="text" 
                    ref={editorTitleRef}
                    onChange={(e) => {
                        onSetTitle(e.target.value)
                        onUpdateTitle(e.target.value)
                    }} 
                    value={title} 
                    placeholder="Project Title" 
                    className="w-fit max-w-[255px] truncate px-3 py-1.5 rounded-[8px]
                        text-[15px] font-medium text-gray-800 placeholder-gray-400 
                        bg-gray-50 border border-gray-200 shadow-sm
                        transition-all duration-200 ease-in-out
                        hover:bg-gray-100 hover:border-gray-300
                        focus:bg-white focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/45 focus:outline-none"
                />                                
                )}
            </div>

            <div className="flex items-center">

                <QuizSettingsDialog {...settingsProps} />

                <div className="w-[2px] h-5  bg-gray-200 mx-3"/>

                <button
                    className="
                        flex items-center justify-center gap-2.5
                        px-3 py-[9px]
                        bg-blue-600 hover:bg-blue-500
                        rounded-[7px] cursor-pointer
                        transition-all duration-200
                        active:scale-[0.97]
                    "
                >
                    <SharpLightning className="w-[18px] h-[18px] text-white" />

                    <span className="text-white text-[12px] font-medium tracking-wide">
                        Upgrade to Pro
                    </span>
                </button>
            </div>


        </div>
    </header>        
  );
}
