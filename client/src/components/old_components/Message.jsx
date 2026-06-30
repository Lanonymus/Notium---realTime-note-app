import { HugeiconsIcon } from '@hugeicons/react';
import { MoreHorizontalIcon  } from '@hugeicons/core-free-icons';
import { Edit03Icon  } from '@hugeicons/core-free-icons';
import { Delete02Icon  } from '@hugeicons/core-free-icons';
import { Tick01Icon  } from '@hugeicons/core-free-icons'; 
import { useEffect, useRef, useState } from 'react';
import AutoResizeTextarea from '../../hooks/AutoResizeTextarea';
import { HighlightTags } from '../Functions/HighlightTags';
import TextFile from '../FileFormats.jsx/textFile';

function timeAgo(from, to = new Date()) {
  const ms = to - from;
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours   = Math.floor(minutes / 60);
  const days    = Math.floor(hours / 24);
  const weeks   = Math.floor(days / 7);
  const months  = Math.floor(days / 30);
  const years   = Math.floor(days / 365);

  if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
  if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
  if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
//   ${seconds} second${seconds !== 1 ? 's' : ''} ago
  return `Now`;
}


export default function Message({
    admin = false,
    removeMessage,
    sendEditedMsg,
    id,
    fromColor,
    toColor, 
    username, 
    message, 
    msgDate, 
    showChat, 
    msgUserID,
    currentUserID,
    files
}) {

    const [showMenu, setShowMenu] = useState(false)
    const timeFromPost = timeAgo(msgDate)
    const menuRef = useRef(null)
    const textareaRef = useRef(null)
    const [editing, setEditing] = useState(false)
    const [editedMsg, setEditedMsg] = useState(message)
    


    useEffect(() => {
        if(!showChat) {
            setShowMenu(false)
        }
    }, [showChat])

    

    useEffect(() => {
        const handleClickOutside = (e) => {
            if(menuRef.current && !menuRef.current.contains(e.target)) {
                setShowMenu(false)
            }
        }

        window.addEventListener('mousedown', handleClickOutside)
        return () => window.removeEventListener('mousedown', handleClickOutside)
    },[])
    

    return (
        <div className="w-full h-auto p-1 flex font-Inter hover:bg-gray-50 select-none" >
            {admin ? 
            <div className={`h-[28px] w-[28px] bg-gradient-to-bl ${fromColor} ${toColor}
                rounded-[50%]`}>
            </div>
            :
            <div
                className="h-[28px] w-[28px] rounded-full bg-gradient-to-bl"
                style={{
                    backgroundImage: `linear-gradient(to bottom left, ${fromColor}, ${toColor})`
                }}
            ></div>
            }

            <div className="flex flex-col pl-3 w-[90%]">
                <div className="w-full flex justify-between items-center relative">
                    <div className='flex gap-3 overflow-hidden'>
                        <div className="text-gray-800 font-medium text-[13px] truncate whitespace-nowrap">{username}</div>
                        <div className="text-gray-400 text-[13px] font-light whitespace-nowrap">{timeFromPost}</div>
                    </div>
                    <div ref={menuRef}  className='flex flex-col'>
                        {editing ? 
                            <div className={`w-[20px] flex h-[20px] rounded-[50%] bg-lime-200
                            hover:bg-lime-300 cursor-pointer outline-1 outline-gray-300  items-center
                            justify-center group`}
                                onClick={() => {
                                    setEditedMsg(message)
                                    console.log(message);
                                    sendEditedMsg(id, editedMsg)
                                    setEditing(false)
                                    
                                }}
                            >
                                <HugeiconsIcon className='text-gray-800' size={16} icon={Tick01Icon } />
                            </div>         
                            :
                            <div className={`w-[20px] h-[20px] rounded-[50%]
                            hover:bg-gray-100 cursor-pointer outline-1 outline-gray-300 items-center
                            justify-center group ${currentUserID !== msgUserID || admin ? "hidden" : "flex"}`} onClick={() => setShowMenu(!showMenu)}>
                                <HugeiconsIcon className='text-gray-600 group-hover:text-gray-800' size={16} icon={MoreHorizontalIcon} />
                            </div>
                        }

                        <div
                            className={`absolute right-0 z-999 duration-150
                            ${showMenu ? "opacity-100 pointer-events-auto top-[25px]" : "opacity-0 pointer-events-none top-[15px]"}
                            bg-white outline-1 outline-gray-200 shadow-xl shadow-gray-300 py-2 px-2 rounded-[3px] flex flex-col
                            `}>
                            <div className='text-gray-500 text-[12px] flex justify-start
                            items-center gap-1 hover:bg-gray-100 rounded-[3px] py-1 px-1 cursor-pointer'
                                onClick={() => {
                                    setEditing(true)
                                    setShowMenu(false)
                                    setEditedMsg(message)
                                    console.log(message);
                                    
                                }}
                            >
                                <HugeiconsIcon size={16} icon={Edit03Icon} />
                                Edit Comment
                            </div>
                            <div className='text-gray-500 text-[12px] flex justify-start
                            items-center gap-1 hover:bg-gray-100 rounded-[3px] py-1 px-1 cursor-pointer'
                                onClick={() => {
                                    removeMessage(id)
                                    setShowMenu(false)
                                    console.log('message to delete: ', message, id);
                                    
                                }}
                            >
                                <HugeiconsIcon size={16} icon={Delete02Icon} />
                                Delete Comment
                            </div>
                        </div>
                    </div>
                </div>
                
                {editing ? (
                    <AutoResizeTextarea 
                        ref={textareaRef}
                        className='w-full text-normal h-auto overflow-hidden resize-none
                        text-gray-700 font-light whitespace-pre-wrap break-words text-[14px] outline-none'
                        type="text" 
                        onChange={(e) => {
                            setEditedMsg(e.target.value)
                        }}
                        rows={1}
                        value={editedMsg}    
                        onKeyDown={(e) => {
                            if(e.key === "Enter") {
                                e.preventDefault()
                                sendEditedMsg(id, editedMsg)
                                setEditing(false)
                                console.log('Próba edycji wiadomości');
                                
                                // sendMessage()
                                // textareaRef.current?.blur()
                            }
                        }}    
                        
                    />
                    // < className="text-[14px] w-full text-gray-700 font-light whitespace-pre-wrap break-words">{message}</div>
                ) : <div className="text-[14px] w-full text-gray-700
                 font-light whitespace-pre-wrap break-words">{HighlightTags(message)}</div>
                }

                {/* Files if exist */}
                {files && files.map((file, index) => {
                    // console.log('pliki w wiadomości: ',files)
                    
                    return <TextFile file={file} key={index}/>
                })}

            </div>
        </div>
    )
}