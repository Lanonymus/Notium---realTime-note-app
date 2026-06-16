import { HugeiconsIcon } from '@hugeicons/react';
import { Comment01Icon  } from '@hugeicons/core-free-icons';
import { AtIcon  } from '@hugeicons/core-free-icons';
import { SmileIcon  } from '@hugeicons/core-free-icons';
import { Attachment01Icon  } from '@hugeicons/core-free-icons';
import { SentIcon  } from '@hugeicons/core-free-icons';
import { useEffect, useRef, useState } from 'react';
import Message from './Message';
import AutoResizeTextarea from '../hooks/AutoResizeTextarea';
import { v4 as uuidv4 } from 'uuid'
import ToolTip from './ToolTip';
import EmojiMenu from './EmojiMenu';
import React from 'react';
import FileUploader from './FileUploader';
import InputFile from './FileFormats.jsx/inputFile';

export default  React.memo(function Chat({ 
    handleChatChange,
    users,
    uuid,
    chatMessages 
}) {


    const [showChat, setShowChat] = useState(false)
    // const [msg, setMsg] = useState("")
    const msgRef = useRef("")

    const chatRef = useRef(null)
    const containerRef = useRef(null)
    const textareaRef = useRef(null)
    const prevCountRef = useRef(chatMessages.length)

    const [showMentionMenu, setShowMentionMenu] = useState(false)
    const [showEmojiMenu, setShowEmojiMenu] = useState(false)
    
    const mentionMenu = useRef(null)
    const mentionMenuBtn = useRef(null) 
    const emojiMenuButton = useRef(null)
    const [files, setFiles] = useState([])

    const usersWithoutState = Object.entries(users).map(([uuid, { username, profileColor }]) => ({
            uuid,
            username,
            profileColor
    }))

    const username = users[uuid]?.username
    const userProfileColor = users[uuid]?.profileColor

    console.log('Render chatu: ', chatMessages);
    
 
    

    // automatyczny scroll po każdej zmianie chatMessages
    useEffect(() => {
        const prev = prevCountRef.current
        const curr = chatMessages.length

        if(curr > prev) {
            const c = containerRef.current
            if (c) c.scrollTop = c.scrollHeight
        }

        prevCountRef.current = curr
    },[chatMessages])


    const getLighterColorVersion = (orginalColor) => {
        // Zakładamy że userProfileColor to string w formacie: "hsl(H, S%, L%)"
        const hslRegex = /hsl\((\d+),\s*(\d+)%?,\s*(\d+)%?\)/;
        const match = orginalColor.match(hslRegex);

        let brighterColor = userProfileColor;

        if (match) {
            const h = parseInt(match[1]);
            const s = parseInt(match[2]);
            const l = parseInt(match[3]);

            // Zwiększamy jasność o 20%, maksymalnie do 100%
            const brighterL = Math.min(l + 30, 100);
            brighterColor = `hsl(${h}, ${s}%, ${brighterL}%)`;
        }
        return brighterColor
    }

    const sendMessage = () => {
        if(!msgRef.current.trim()) return        

        
        const chatMsg = {
            msgUserID: uuid,
            id: uuidv4(),
            username: username,
            date: Date.now(),
            message: msgRef.current,
            fromColor: getLighterColorVersion(userProfileColor), // from-color-100
            toColor: userProfileColor, // from-color-300
            files: files  
        }
        // console.log(chatMsg);
        
        document.getElementById('msgInput').value = ""
        chatMessages.push(chatMsg)
        handleChatChange(chatMessages)
        msgRef.current = ""
        setFiles([])
    }

    const sendEditedMsg = (msgID, newMessage) => {
        const oldMessage = chatMessages.filter(msg => msg.id === msgID)
        console.log('Stara wiadomość: ', oldMessage);
        
        oldMessage[0].message = newMessage
        console.log(chatMessages);
        
        handleChatChange(chatMessages)
        
        
    }

    const removeMessage = (msgID) => {
        console.log('before removal: ', chatMessages);
        chatMessages = chatMessages.filter(n => n.id !== msgID)
        console.log('After removal: ', chatMessages);
        
        handleChatChange(chatMessages)
    }

    const removeFile = (file) => {
      setFiles(files.filter(f => f !== file))
    }

    const addEmoji = (emoji) => {
      msgRef.current += emoji
      textareaRef.current.value = msgRef.current

      // setMsg(prev => prev+emoji)
      setShowEmojiMenu(false)
    }

    const handleFileSelected = async (file) => {
      console.log('Wybrany plik: ', file);
      
      // Link do źródła pliku konwertujemy na base64
      const dataUrl = await new Promise(resolve => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.readAsDataURL(file)
      })

      // Ustawiamy customowy obiekt 
      setFiles(prev => [
        ...prev,
        {
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl // ten string można przesłał do JSON
        }
      ])
    }

    useEffect(() => {
        const handleClickOutside = (e) => {
            if(chatRef.current && !chatRef.current.contains(e.target)) {
                setShowChat(false)

            }
            if(mentionMenu.current && mentionMenuBtn.current 
                && !mentionMenu.current.contains(e.target) && !mentionMenuBtn.current.contains(e.target)) {
                setShowMentionMenu(false)
            }
            
        }

        window.addEventListener('mousedown', handleClickOutside)
        return () => window.removeEventListener('mousedown', handleClickOutside)
    },[])

    return (
      <div className="z-999" ref={chatRef}>
        <div
          className={`w-[81px] py-1 
            rounded-[4px] outline-1 bg-white flex gap-2 justify-center items-center
            hover:bg-gray-50 cursor-pointer select-none duration-100 ${
              showChat ? "bg-gray-50 outline-gray-400" : "outline-gray-300"
            }`}
          onClick={() => {
            setShowChat(!showChat);
          }}
        >
          <div>
            <HugeiconsIcon
              className="text-gray-800"
              size={20}
              icon={Comment01Icon}
            />
          </div>
          <div className="text-gray-800 text-[14px] ">Chat</div>
        </div>

        <div
          className={`absolute left-0 w-[300px] h-auto
                outline-1 outline-gray-300 bg-white shadow-xl shadow-gray-300 duration-150
                ${
                  showChat
                    ? "opacity-100 top-[45px] pointer-events-auto"
                    : "opacity-0 top-[15px] pointer-events-none"
                } 
                rounded-[6px]`}
        >
          <div
            className="w-full py-3 px-2 text-gray-500 font-Inter text-[14px] flex justify-center
                items-center border-b-1 border-gray-200"
          >
            Public Chat
          </div>

          <div className="w-full h-auto  flex flex-col justify-between">
            
            {/* Messages */}
            <div
              ref={containerRef}
              className="flex flex-col gap-2 py-3 px-2 min-h-[250px] max-h-[350px]
                    overflow-y-auto custom-scroll "
            >
              <Message
                admin={true}
                fromColor={"from-purple-100"}
                toColor={"to-purple-300"}
                username={"Jacob Gacek"}
                message={"Hey thanks for testing the app"}
                msgDate={1752337213624}
                showChat={showChat}
                userID={"super-secret-password"}
              />
              {chatMessages.map((msg, index) => (
                <Message
                  key={index}
                  id={msg.id}
                  fromColor={msg.fromColor}
                  toColor={msg.toColor}
                  username={msg.username}
                  message={msg.message}
                  msgDate={msg.date}
                  showChat={showChat}
                  removeMessage={removeMessage}
                  sendEditedMsg={sendEditedMsg}
                  msgUserID={msg.msgUserID}
                  currentUserID={uuid}
                  files={msg.files}
                />
              ))}
            </div>

            {/* Sending Message */}
            <div className="w-full h-auto p-2 border-t-1 border-gray-200 relative">
              <AutoResizeTextarea
                ref={textareaRef}
                className="w-full text-normal h-auto overflow-hidden resize-none text-gray-600 text-wrap placeholder:text-gray-400 placeholder:font-light text-[14px] outline-none"
                placeholder="Write a message"
                type="text"
                onChange={(e) => {
                  msgRef.current = e.target.value
                }}
                rows={1}
                id="msgInput"
                defaultValue="" // 👈 NIE "value"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    sendMessage();
                    setFiles([])
                    textareaRef.current?.blur();
                  }               
                  if (e.key === "@") {
                    msgRef.current += "@"
                    textareaRef.current.value = msgRef.current
                    // setMsg(prev => prev+" @")
                    e.preventDefault();
                    setShowMentionMenu(true)
                  }

                }}
              />
              {/* Files if exist */}
              {files && files.map((file, index) => {
                // console.log('pliki w Chat: ',files)
                return <InputFile file={file} key={index} removeFile={removeFile}/>
              })
              }
              
              {/* Emoji Menu */}
              <EmojiMenu  
                addEmoji={addEmoji} 
                showEmojiMenu={showEmojiMenu} 
                setShowEmojiMenu={setShowEmojiMenu}
                buttonRef={emojiMenuButton}
              />

            {/* Mention Menu */}
            <div ref={mentionMenu}
            className={`absolute left-[15px] px-1 bg-white outline-1 rounded-[4px] py-1
                        outline-gray-200 shadow-xl shadow-gray-300 flex-col duration-150
                        ${showMentionMenu ? "flex  opacity-100 bottom-[70px] pointer-events-auto" : 
                        "pointer-events-none opacity-0  bottom-[20px]"}`}
            >
            {Object.entries(usersWithoutState).map(([key, value]) => {
            //   console.log(value) 
                return (
                <div className="flex gap-2 px-1 py-1 cursor-pointer select-none bg-white hover:bg-gray-100 rounded-[3px]" key={key} 
                    onClick={() => {
                        // setMsg(prev => prev + ""+value.username)
                        
                        msgRef.current += ""+value.username
                        textareaRef.current.value = msgRef.current
                        console.log('test lol');
                        setShowMentionMenu(false)
                    }}
                >
                    <div
                    className={`h-[20px]  w-[20px]
                        bg-gradient-to-bl rounded-[50%]`}
                    style={{
                        backgroundImage: `linear-gradient(to bottom left, ${getLighterColorVersion(value.profileColor)}, ${value.profileColor})`
                    }}
                    ></div>
                    <div className='text-[12px] w-[80px] text-gray-500 capitalize'>{value.username}</div>
                </div>
                );
            })}
            </div>


              <div className="w-full flex pt-[4px] justify-between items-center">
                <div className="w-full flex">
                  <div ref={mentionMenuBtn}
                    className="group w-[25px] h-[25px] flex justify-center items-center 
                                bg-gray-white hover:bg-gray-100 rounded-[4px] relative cursor-pointer"
                    onClick={() => {
                      // setMsg(prev => prev+" @");

                      msgRef.current += "@"
                      textareaRef.current.value = msgRef.current
                      setShowMentionMenu(!showMentionMenu);
                    }}
                  >
                    <HugeiconsIcon
                      className="text-gray-700"
                      size={16}
                      icon={AtIcon}
                    />
                    <ToolTip info={"Mention"} />
                  </div>
                  <div
                    className="group w-[25px] h-[25px] flex justify-center items-center 
                                bg-gray-white hover:bg-gray-100 rounded-[4px] relative cursor-pointer"
                    ref={emojiMenuButton}
                    onClick={() => {
                      setShowEmojiMenu(!showEmojiMenu)
                    }}
                  >
                    <HugeiconsIcon
                      className="text-gray-700"
                      size={16}
                      icon={SmileIcon}
                    />
                    <ToolTip info={"Emotes"} />
                  </div>
                  
                  {/* Uploading files to the chat */}
                  <FileUploader onFileSelected={handleFileSelected}/>
                
                  </div>
                <div
                  className={`w-[35px] h-[32px] flex justify-center items-center
                            rounded-[4px] ${
                              msgRef.current === "" ? "bg-[#88BBFF]" : "bg-[#1177FF]"
                            } hover:bg-[hsl(214,100%,60%)]`}
                >
                  <HugeiconsIcon
                    className="text-gray-100 "
                    size={20}
                    icon={SentIcon}
                    onClick={sendMessage}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

})

