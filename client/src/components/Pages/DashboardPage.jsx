import { HugeiconsIcon } from '@hugeicons/react';

import { Home09Icon  } from '@hugeicons/core-free-icons';
import { MailOpenIcon  } from '@hugeicons/core-free-icons';
import { UserGroupIcon  } from '@hugeicons/core-free-icons';
import { IdeaIcon  } from '@hugeicons/core-free-icons';
import { Settings02Icon  } from '@hugeicons/core-free-icons';
import { Logout02Icon  } from '@hugeicons/core-free-icons';
import { Search01Icon  } from '@hugeicons/core-free-icons';
import { User02Icon  } from '@hugeicons/core-free-icons';
import { Notification01Icon } from '@hugeicons/core-free-icons';
import { ArrowDown01Icon } from '@hugeicons/core-free-icons';
import { PlusSignIcon } from '@hugeicons/core-free-icons';
import { Presentation04Icon } from '@hugeicons/core-free-icons';
import { NoteIcon } from '@hugeicons/core-free-icons';
import { TaskDaily01Icon } from '@hugeicons/core-free-icons';
import { GridTableIcon } from '@hugeicons/core-free-icons';
import { SortingAZ01Icon } from '@hugeicons/core-free-icons';



import { useEffect, useState } from "react";
import DashboardTab from '../Elements/DashboardTab';
import DashboardTemplate from '../Elements/DashboardTemplate';
import DashboardProject from '../Elements/DashboardProject';
import BackgroundDots from '../BackgroundDots';

export default function DashboardPage() {
  const [user, setUser] = useState(null);

  // Pobieramy informacje użytkownika
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) return;

    fetch("http://localhost:8000/api/getUserData", {
        method: "GET",
        headers: {
            "Authorization": token
        }
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            setUser(data.user)
            console.log(data);
            
        } else {
            console.error("Błąd", data.message);
            
        }
    })
    .catch(err => console.error("Błąd seci", err));
  }, [])

  if (!user) return <p>Ładowanie...</p>;

  return (
    <div>
      <div className="w-full h-[100vh] flex">
        <div className="bg-white w-[295px] flex flex-col p-6 items-start justify-start border-2 border-gray-200 border-r">
          {/* Logo */}
          <div className="flex items-center gap-[4px]">
            <div className="rounded-[7px] overflow-hidden">
              <img
                src="./RTE_logo_10.png"
                className="h-[45px] cursor-pointer transform  w-auto"
                alt=""
                onClick={() => {
                  navigate("/");
                }}
              />
            </div>
            <span className="text-[20px]  font-Manrope font-semibold  text-gray-700 ">
              Notium
            </span>
          </div>

          <div className="w-full p-2 mt-20">
            {/* First Tab */}
            <div className="text-[14px]  font-Manrope font-light text-gray-500 mb-3 ">
              OVERVIEW
            </div>

            <div className="flex flex-col gap-2 w-full">
              <DashboardTab icon={Home09Icon} text={"Dashboard"}/>
              <DashboardTab icon={MailOpenIcon} text={"Inbox"}/>
              <DashboardTab icon={UserGroupIcon} text={"Group"}/>
            </div>

            {/* Second Tab */}
            <div className="text-[14px]  font-Manrope font-light text-gray-500 mt-10 mb-3 ">
              APPEARANCE
            </div>
            <div className="flex flex-col gap-2 w-full">
              <DashboardTab icon={IdeaIcon} text={"Light Mode"} active={true}/>
            </div>

            {/* Third Tab */}
            <div className="text-[14px]  font-Manrope font-light text-gray-500 mt-10 mb-3 ">
              GENERAL
            </div>
            <div className="flex flex-col gap-2 w-full">
              <DashboardTab icon={Settings02Icon} text={"Settings"} />
              <DashboardTab icon={Logout02Icon} text={"Log Out"}  />
            </div>

          </div>
        </div>
        <div className="bg-gray-100 w-full flex flex-col">

          {/* Header */}
          <div className='w-full h-[100px] flex items-center px-10 py-6 justify-between border-b-1 border-gray-200'>
                
                <div className='z-10 w-[60%]  h-[35px] rounded-[100px] outline-[2px] outline-gray-200
                 bg-white flex px-3 py-[28px] gap-2 items-center'>

                  <HugeiconsIcon icon={Search01Icon} size={20} className='text-gray-500'/>

                  <input 
                    type="text" 
                    className='text-[17px] font-Manrope font-normal placeholder:text-gray-400
                    focus:border-none border-none outline-none w-full text-gray-700' 
                    placeholder='Search for project..'
                  />
                </div>


                <div className='flex gap-2 items-center'>

                  <div className='w-auto h-auto p-3 rounded-[50%] outline-1 outline-gray-300 bg-gray-50 flex justify-center items-center'>
                    <HugeiconsIcon icon={Notification01Icon} className='text-gray-800' size={23} />
                  </div>

                  <div className='w-[2px] h-[30px] bg-gray-200 '></div>


                  <div className='w-auto h-auto p-3 bg-gray-200 border-gray-200 border-1 rounded-[50%]'>
                    <HugeiconsIcon icon={User02Icon} size={25} className='text-gray-800' />
                  </div>

                  <div className='p-2 gap-2 cursor-pointer hover:bg-gray-200 duration-75 rounded-[6px] flex'>
                    <div className='font-Manrope font-[600] text-gray-800'>{user.username}</div>

                    <div><HugeiconsIcon icon={ArrowDown01Icon} size={25} className='text-gray-400' strokeWidth={2}/></div>
                  </div>

                </div>
          </div>

          {/*Dashboard Content */}
          <div className=' h-full flex flex-col px-18 pt-6 bg-white gap-6'>

              {/* Creating new projects Panel */}
              <div className='w-full h-auto outline-1 outline-gray-200 flex-col rounded-[4px] overflow-hidden'>
                {/* First Part */}
                <div className='w-full h-[75px] bg-gray-100 flex items-center justify-between p-4 relative'>
                  {/* <BackgroundDots 
                    customPos={"[background-position:-0px_-0px]"} 
                    customSize={"[background-size:20px_20px]"} 
                    customGradient={"[background-image:radial-gradient(rgba(12,12,12,0.2)_1px,transparent_0)]"}
                  /> */}

                  <div className='w-auto h-[75px] flex flex-col justify-center z-10'>
                    <div className='text-gray-700 text-[18px] font-Manrope font-[600]'>Create a new Project</div>
                    <div className='text-gray-500 text-[14px] font-Manrope font-[400] '>Choose a template and start working on the project</div>                    
                  </div>

                  <div className='font-Manrope font-[500] text-white py-[10px] px-5 rounded-[60px] bg-gray-900 cursor-pointer duration-100 hover:bg-gray-800 z-10'>
                    Create Project
                  </div>

                </div>

                {/* Templates */}
                <div className='w-full h-full bg-white px-8 py-5 flex gap-10 '>
                  <DashboardTemplate icon={PlusSignIcon} title={"Empty Document"} user={user}/>
                  <DashboardTemplate icon={Presentation04Icon} title={"Example project"}  user={user}/>
                  <DashboardTemplate icon={NoteIcon} title={"Meeting notes"}  user={user}/>
                  <DashboardTemplate icon={TaskDaily01Icon} title={"To do list"}  user={user}/>
  
                </div>
              </div>

              {/* Latest Projects */}
              <div className='h-auto w-full flex flex-col outline-1 outline-gray-200 rounded-[4px] '>
                <div className=' items-center w-full h-auto overflow-hidden justify-between flex border-b-1 border-gray-200'>
                  <div className=' px-5 py-3 text-gray-800 text-[18px] font-Manrope font-[400] h-full border-r-1 border-gray-200'>Latest documents</div>   
                  {/* Sort by */}
                  
                  <div className='flex gap-3 items-center'>
                    <div className='flex items-center gap-1 text-[14px] text-gray-600 font-[400] cursor-pointer justify-center p-2 rounded-[9px]
                    hover:bg-gray-200 duration-100 hover:text-gray-800'>
                      Belonging to me 
                      <div><HugeiconsIcon icon={ArrowDown01Icon} size={23} className='text-gray-600' strokeWidth={1.5}/></div>
                    </div>       

                    <div className='w-auto h-auto p-[10px] cursor-pointer hover:bg-gray-200 rounded-[50%]'>
                      <HugeiconsIcon icon={GridTableIcon} size={23} className='text-gray-700'/>
                    </div>  
                    <div className='w-auto h-auto p-[10px] cursor-pointer hover:bg-gray-200 rounded-[50%]'>
                      <HugeiconsIcon icon={SortingAZ01Icon} size={23} className='text-gray-700' />
                    </div>

                  </div> 
                </div>

              {/* Projects */}
              <div className='grid grid-cols-[repeat(auto-fill,minmax(205px,1fr))] gap-[15px] p-5 w-full'>
              

                <DashboardProject title={"My gym routine"} date={"Otwarto 22 sie 2025"} imgSrc={"./RTE_ss_1.png"} />
                <DashboardProject title={"My gym routine"} date={"Otwarto 22 sie 2025"} imgSrc={"./RTE_ss_1.png"} />
                <DashboardProject title={"My gym routine"} date={"Otwarto 22 sie 2025"} imgSrc={"./RTE_ss_1.png"} />

     
              </div>
            </div>


          </div>

        </div>
      </div>
      {/* <h1>Witaj, {user.email}!</h1>
      <p>ID: {user.id}</p> */}
    </div>
  );
}

