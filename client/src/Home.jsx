// import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
// import useWebSocket from 'react-use-websocket'
// import throttle from 'lodash.throttle'
// import { Cursor } from './components/Cursor'
// import ToolBar from './components/ToolBar';
// import { createEditor, Editor, Element, last, Text, Transforms } from 'slate'
// import { Slate, Editable, withReact, ReactEditor, useSlateStatic } from 'slate-react'
// import CodeBlock from './components/TextBlocks/CodeBlock';
// import DefaultBlock from './components/TextBlocks/DefaultBlock';
// import TextFont from './components/TextFormats/TextFont';
// import Chat from './components/Chat';
// import RenderCursors from './components/RenderCursors';
// import { useSearchParams } from 'react-router-dom';
// import { NavigateDashboard } from './components/navigateDashboard';



// const getLighterColorVersion = (orginalColor) => {
//     // Zakładamy że userColor to string w formacie: "hsl(H, S%, L%)"
//     const hslRegex = /hsl\((\d+),\s*(\d+)%?,\s*(\d+)%?\)/;
//     // console.log(orginalColor);
    
//     const match = orginalColor.match(hslRegex);

//     let brighterColor = orginalColor;

//     if (match) {
//         const h = parseInt(match[1]);
//         const s = parseInt(match[2]);
//         const l = parseInt(match[3]);

//         // Zwiększamy jasność o 20%, maksymalnie do 100%
//         const brighterL = Math.min(l + 20, 100);
//         brighterColor = `hsl(${h}, ${s}%, ${brighterL}%)`;
//     }
//     return brighterColor
// }



// const getInitials = (fullName) => {
//     fullName = fullName.replace('"','')
//     const parts = fullName.trim().split(" ") // dzielimy na 2 osobne stringi
//     let initials = ""
//     if(parts.length === 2){
//         // Mapujemy przez dwa osobne stringi i tylko zostawiamy pierwszą litere jeśli istnieję
//         initials = parts.map(part => part[0]?.toUpperCase()).join("")
//     } else {
//         initials = fullName.slice(0, 2).toUpperCase()
//     }
    
//     return initials
// }

// // Define our own custom set of helpers.
// const CustomEditor = {

//   getColorMark(editor) {
//     const marks = Editor.marks(editor)
//     return marks?.fontColor || null
//   },

//   isBoldMarkActive(editor) {
//     const marks = Editor.marks(editor)
//     return marks ? marks.bold === true : false
//   },

//   isItalicActive(editor) {
//     const marks = Editor.marks(editor)
//     return marks ? marks.italic === true : false
//   },

//   isCodeBlockActive(editor) {
//     const [match] = Editor.nodes(editor, {
//       match: n => n.type === 'code',
//     })

//     return !!match
//   },


//   toggleBoldMark(editor) {
//     const isActive = CustomEditor.isBoldMarkActive(editor)
//     if (isActive) {
//       Editor.removeMark(editor, 'bold')
//     } else {
//       Editor.addMark(editor, 'bold', true)
//     }
//   },

//   toggleItalicMark(editor) {
//     const isActive = CustomEditor.isItalicActive(editor)
//     if(isActive) {
//         Editor.removeMark(editor, 'italic')
//     } else {
//         Editor.addMark(editor, 'italic', true)
//     }
//   },

//   toggleCodeBlock(editor) {
//     const isActive = CustomEditor.isCodeBlockActive(editor)
//     Transforms.setNodes(
//       editor,
//       { type: isActive ? null : 'code' },
//       { match: n => Element.isElement(n) && Editor.isBlock(editor, n) }
//     )
//   },

//   getFontFamilyMark(editor) {
//     const marks = Editor.marks(editor)
//     return marks?.fontFamily || null
//   },

//   setFontFamilyMark(editor, fontFamily) {
//     Transforms.setNodes(
//         editor,
//         {},
//         { match: n => Text.isText(n), split: true}
//     )
//     Editor.addMark(editor, 'fontFamily', fontFamily)
//   },

//   removeFontFamilyMark(editor) {
//     Editor.removeMark(editor, 'fontFamily')
//   },

//   setFontSize(editor, size) {
//     Transforms.setNodes(
//         editor,
//         { fontSize: size},
//         { match: Text.isText, split: true}
//     )
//   },

//   setColor(editor, color) {
//     Transforms.setNodes(
//         editor,
//         {},
//         { match: Text.isText, split: true}
//     )
//     Editor.addMark(editor, 'fontColor', color)
//   },

//   removeColor(editor) {
//     Editor.removeMark(editor, 'fontColor')
//   }
  
// }


// const renderUserList = users => {
//     const distance = 32
//     const userEntries = Object.entries(users)
//     const visibleUsers = userEntries.slice(0, 3)
//     const hiddenUsers = userEntries.slice(3,userEntries.length)
//     const remainingCount = userEntries.length - visibleUsers.length

//     return (
//             <div className='w-fit h-fit flex'>
//                 {visibleUsers.map(([uuid, user], index) => (
//                     <div
//                         key={uuid}
//                         className='w-[38px] h-[38px] rounded-[50%] shadow-xl
//                         shadow-gray-300 bg-gradient-to-bl
//                         border-1 border-white flex justify-center items-center text-[14px]
//                         text-white z-1 -mr-[7px] relative group cursor-pointer'
//                         style={{
//                             backgroundImage: `linear-gradient(to bottom left, ${getLighterColorVersion(user.profileColor)}, ${user.profileColor})`
//                         }}
//                     >
//                         {getInitials(user.username)}
//                         <div className='toolTip'>{user.username}</div>
//                     </div>
//                 ))}

//                 {remainingCount > 0 && (
//                     <div
//                         className='w-[38px] h-[38px] rounded-[50%] shadow-xl
//                         shadow-gray-300 
//                         border-1 border-white flex justify-center items-center text-[14px]
//                         text-gray-600 bg-[#DEE9EF] z-2 relative group'

//                     >
//                         {`+${remainingCount}`}
//                         <div className='toolTip'>
//                             {hiddenUsers.map(([uuid, user], index) => user.username).join(", ")}
//                         </div>
//                     </div>
//                 )}
//             </div>
//     )
// }



// export function Home() {

//     const [searchParams] = useSearchParams()
//     const room = searchParams.get('room')
//     const username = searchParams.get('username') 
//     const wsRef = useRef(null)


//     const [title, setTitle] = useState("Title of the project")
//     const [uuid, setUuid] = useState(null)
//     const [profileColor, setProfileColor] = useState(null)
//     const [users, setUsers] = useState({}) // użytkownicy
//     const [chatMessages, setChatMessages] = useState([]) // wiadomości chatu
//     const [isReady, setIsReady] = useState(false)
//     const isRemoteUpdate = useRef(false)

//     const [selectionActive, setSelectionActive] = useState(false)
//     const textAreaRef = useRef(null)
//     const toolbarRef = useRef(null)

//     // Wartości z slate
//     const [editor] = useState(() => withReact(createEditor()))
//     const [editorKey, setEditorKey] = useState(0)

//     // Text value
//     const [value, setValue] = useState([{
//         type: 'paragraph', children: [{ text: ""}]
//     }])
//     const lastSentValue = useRef(value);


//     // Saving selection
//     const [selection, setSelection] = useState(null)
//     const wasToolbarClicked = useRef(false)



//     // Tworzenie połączenia z WebSocketem
//   // ✅ Ustanowienie połączenia WebSocket z pokojem
//   useEffect(() => {
//     if (!room || !username) return;

//     const wsUrl = `ws://localhost:8000/?room=${encodeURIComponent(room)}&username=${encodeURIComponent(username)}`;
//     const ws = new WebSocket(wsUrl);
//     wsRef.current = ws;

//     ws.onopen = () => {
//       console.log(`✅ Connected to room ${room} as ${username}`);
//     };

//     ws.onclose = () => {
//       console.warn("❌ WebSocket disconnected");
//     };

//     ws.onerror = (err) => {
//       // jeśli socket został zamknięty celowo, ignorujemy błąd
//       if (ws.readyState === WebSocket.CLOSED) return;
//       console.error("⚠️ WebSocket error", err);
//     };

//     ws.onmessage = (event) => {
//       let data;
//       try {
//         data = JSON.parse(event.data);
//       } catch {
//         console.warn("Niepoprawny JSON:", event.data);
//         return;
//       }

//       if (data.senderUuid === uuid) return; // 👈 ignoruj własne zmiany

//       const type = data.type?.toUpperCase();
//       switch (type) {
//         case "WELCOME":
//           setUuid(data.uuid);
//           break;

//         case "FULL_STATE":
//           console.log('Wiadomość typu Hello: ',data);
          
//           setTitle(data.editorTitle);
//           setUsers(data.users);
//           setChatMessages(data.chatMessages ?? []);
//           if (data.editorText) {
//             try {
//               setValue(JSON.parse(data.editorText));
//             } catch {
//               setValue([{ type: "paragraph", children: [{ text: data.editorText ?? "" }] }]);
//             }
//           }
//           setIsReady(true);
//           break;

//         case "UPDATE_DOC":
//           try {
//             const newValue = JSON.parse(data.editorText);

//             // Update z serwera nie lokalny
//             isRemoteUpdate.current = true

//             // 🔒 zaktualizuj treść edytora bez jego remountowania
//             // Transforms.deselect(editor); // unselect to avoid caret jump
//             editor.children = newValue;  // podmień zawartość
//             editor.onChange();           // wymuś re-render
//             setValue(newValue);          // zsynchronizuj ze stanem Reacta

//             // 🔁 Zsynchronizuj ostatnią wartość
//             lastSentValue.current = newValue;

//             console.log('📋 Zaktualizowano treść dokumentu od innego użytkownika');
//           } catch (err) {
//             console.warn('Błąd podczas parsowania', err);
//           } finally {
//             setTimeout(() => (isRemoteUpdate.current = false), 0)
//           }
//           break;

//         case "UPDATE_TITLE":
//           setTitle(data.editorTitle);
//           break;

//         case "UPDATE_CHAT":
//           setChatMessages(data.chatMessages ?? []);
//           break;

//         case "UPDATE_USERS":
//           console.log('zaktualizowano liste ludzi');
          
//           setUsers(data.users ?? {});
//           break;

//         default:
//           // console.log("🟡 Unknown WS message:", data);
//           break;
//       }
//     };

//     // 🧹 WAŻNE: zamykamy socket przy unmount
//     return () => {
//       console.log("🧹 Cleaning up WebSocket connection...");
//       ws.close();
//     };
//   }, [room, username]);





//     // ✅ Funkcja wysyłania danych do serwera
//     const sendMessage = useCallback((payload) => {
//         if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
//         wsRef.current.send(JSON.stringify(payload));
//     }, []);

//     // 🕐 Dodaj throttling dla często wysyłanych aktualizacji
//     const sendMessageThrottled = useRef(throttle(sendMessage, 100));

//     // 📝 Aktualizacja dokumentu
//     const sendDocUpdate = useCallback(
//         (newValue) => {
//         let serialized;
//         try {
//             serialized = JSON.stringify(newValue);
//         } catch {
//             serialized = newValue.map((m) => m.children.map((c) => c.text).join("")).join("\n");
//         }
//         sendMessageThrottled.current({
//             type: "UPDATE_DOC",
//             editorText: serialized,
//             senderUuid: uuid, // 👈 dodaj identyfikator nadawcy
//         });
//         },
//         [sendMessageThrottled]
//     );

//     // 🏷️ Aktualizacja tytułu
//     const sendTitleUpdate = useCallback(
//         (newTitle) => {
//         sendMessageThrottled.current({
//             type: "UPDATE_TITLE",
//             editorTitle: newTitle,
//         });
//         },
//         [sendMessageThrottled]
//     );

//     // 💬 Aktualizacja czatu
//     const handleChatChange = useCallback(
//         (newChat) => {
//         sendMessageThrottled.current({
//             type: "UPDATE_CHAT",
//             chatMessages: newChat,
//         });
//         },
//         [sendMessageThrottled]
//     );

//     // 🧍 Aktualizacja listy użytkowników po połączeniu
//     useEffect(() => {
//         if (isReady) {
//           sendMessage({ type: "UPDATE_USERS" });
//         }
//     }, [isReady, sendMessage]);

  



//     const [counter, setCounter] = useState(0)

//     const handleFontSelect = (fontFamily) => {
//         CustomEditor.setFontFamilyMark(editor, fontFamily)
//         setCounter(counter+1)
//     }

//     const handleFontSizeChange = (fontSize) => {
//         CustomEditor.setFontSize(editor, fontSize)
//         setCounter(counter+1)
//     }

//     const handleBoldText = () => {
//         CustomEditor.toggleBoldMark(editor)
//         setCounter(counter+1)
//     }

//     const handleCodeText = () => {
//         CustomEditor.toggleCodeBlock(editor)
//         setCounter(counter+1)
//     }

//     const handleItalicText = () => {
//         CustomEditor.toggleItalicMark(editor)
//         setCounter(counter+1)
        
//     }

//     const handleColorChange = (color) => {
//         CustomEditor.setColor(editor, color)        
//     }

//     // Pozyskiwanie aktualnego stylowania
//     function useCurrentTextStyle() {
//         const [style, setStyle] = useState({});

//         useEffect(() => {
//             const { selection } = editor;
//             if (!selection) return;

//             const marks = Editor.marks(editor);
//             if (marks) {
//             setStyle({
//                 fontSize: marks.fontSize || 15,
//                 fontColor: marks.fontColor || '#000000',
//                 fontFamily: marks.fontFamily || 'Roboto',
//                 bold: marks.bold || false,
//                 italic: marks.italic || false,
//                 code: CustomEditor.isCodeBlockActive(editor) || false
//             });
//             } else {
//             setStyle({});
//             }
//         }, [editor.selection, counter]); // reaguj na zmianę kursora

//         return style;
//     }

//     // Tworzymy callback dla Slate żeby mógł rozpoznać typ
//     const renderElement = useCallback(props => {
//         switch (props.element.type) {
//             case 'code':
//                 return <CodeBlock {...props}/>
//             default:
//                 return <DefaultBlock {...props}/>
//         }
//     },[])

//     // Tworzymy funkcje renderująco format zapamiętaną przez callback
//     const renderLeaf = useCallback(props => {
//         return <TextFont {...props}/>
//     },[])



//     useEffect(() => {
//     const handleMouseDown = (e) => {
//         if (toolbarRef.current?.contains(e.target)) {
//         wasToolbarClicked.current = true;
//         }
//     };

//     const handleMouseUp = () => {
//         // Reset flag after click
//         setTimeout(() => {
//         wasToolbarClicked.current = false;
//         }, 0);
//     };

//         document.addEventListener("mousedown", handleMouseDown);
//         document.addEventListener("mouseup", handleMouseUp);

//         return () => {
//             document.removeEventListener("mousedown", handleMouseDown);
//             document.removeEventListener("mouseup", handleMouseUp);
//         };
//     }, []);




    
    
//     // console.log('wiadomości chatu: ', chatMessages);
//     if (!isReady) {
//         return (
//         <div className="flex items-center justify-center h-full">
//             Ładowanie…
//         </div>
//         );
//     }
    

//     return (
//         <>
//             <div className='w-full h-[48px] flex justify-center items-center relative bg-white
//             border-b-1 border-gray-200'>

//                 <div className='w-full h-full flex justify-between items-center pl-5 pr-5'>
//                   <div className='gap-3 flex'>
//                       <NavigateDashboard/>

//                       {/* Live Chat */}
//                       <Chat 
//                           handleChatChange={handleChatChange} 
//                           chatMessages={chatMessages} 
//                           users={users}
//                           uuid={uuid}
//                       />
//                   </div>

//                   <ToolBar 
//                     toolbarRef={toolbarRef} 
//                     onFontSelect={handleFontSelect} 
//                     onFontSizeChange={handleFontSizeChange} 
//                     onBold={handleBoldText}
//                     onCode={handleCodeText}
//                     onItalic={handleItalicText}
//                     onColorChange={handleColorChange}
//                     useCurrentTextStyle={useCurrentTextStyle}
//                     />

//                   {renderUserList(users)}
                  
//                 </div>
//             </div>
            
//             {/* {renderCursors(users, uuid)} */}

//             {/* <RenderCursors 
//                 setUsers={setUsers}
//                 users={users} 
//                 uuid={uuid} 
//                 sendJsonMessageThrottled={sendMessageThrottled}
//                 isReady={isReady}
//                 lastJsonMessage={null}
//             /> */}
            
//             <div className='w-full overflow-x-hidden h-[100vh] flex justify-end items-center bg-gray-100 flex-col'>
//                 <input className='text-[20px] text-gray-700 mb-2 focus:outline-gray-300 outline-1 p-1
//                 placeholder:text-gray-700 text-center outline-transparent outline-dashed
//                 focus:text-gray-500'
//                 value={title} onChange={(e) => {
//                     const newProjectTitle = e.target.value
//                     setTitle(e.target.value)
//                     sendTitleUpdate(newProjectTitle)
//                 }}/>

//                 {/* Richtext editor pozwala na dużą elastyczność biblioteka - Slate */}
//                 <Slate editor={editor} initialValue={value}  onChange={(newValue) => {
//                       setValue(newValue);

//                     // 🚫 Pomijamy zmiany pochodzące z serwera
//                     if (isRemoteUpdate.current) return;

//                     // 🚫 Pomijamy zmiany selection — porównujemy dokument
//                     const isDocumentChanged = JSON.stringify(newValue) !== JSON.stringify(lastSentValue.current);
//                     if (!isDocumentChanged) return;

//                     // ✅ Wysyłamy tylko realne zmiany treści
//                     lastSentValue.current = newValue;
//                     sendDocUpdate(newValue);
                                      
//                     if (editor.selection) {
//                         // console.log('saved selection: ',selection);
//                         setSelection(editor.selection); // <-- ZAPISUJEMY TU!
//                     }
//                 }}>
//                     <div className={`w-[650px] h-[850px] relative`}>
//                         <Editable 
//                             className='w-full h-full p-5 bg-white outline-gray-200
//                             outline-1 focus:outline-gray-300 rounded-tl-[3px] rounded-tr-[3px] relative'
//                             renderElement={renderElement}
//                             renderLeaf={renderLeaf}
//                             // onBlur={() => {
//                             // window.requestAnimationFrame(() => {
//                             //     if (wasToolbarClicked.current && selection) {
//                             //         console.log('Restoring selection from toolbar click');
                                    
//                             //         ReactEditor.focus(editor);
//                             //     }
//                             // });
//                             // }}
//                             onKeyDown={(e) => {
//                                 if (!e.ctrlKey) {
//                                     return
//                                 }

//                                 switch (e.key) {
//                                     // When "`" is pressed, keep our existing code block logic.
//                                     case '`': {
//                                         e.preventDefault()
//                                         CustomEditor.toggleCodeBlock(editor)
//                                         break
//                                     }

//                                     // When "B" is pressed, bold the text in the selection.
//                                     case 'b': {
//                                         e.preventDefault()
//                                         CustomEditor.toggleBoldMark(editor)
//                                         break
//                                     }
//                                 }
//                             }}
//                         />                            
                        
//                     </div>
//                 </Slate>   

//             </div>
//         </>
//     )
// }