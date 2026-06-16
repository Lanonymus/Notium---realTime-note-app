import { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from '@hugeicons/react';
import { Search01Icon } from '@hugeicons/core-free-icons';

export default function EmojiMenu({ addEmoji, showEmojiMenu, setShowEmojiMenu, buttonRef }) {

  const listOfCategories = [
    "smileys-emotion", "people-body", "component", "animals-nature", "food-drink",
    "travel-places", "activities", "objects", "symbols", "flags"
  ]

  const [emojiByCategory, setEmojiByCategory] = useState({})
  const emojiMenuRef = useRef(null)
  const [hoveredEmojiName, setHoveredEmojiName] = useState(null)
  const [hoveredEmojiIcon, setHoveredEmojiIcon] = useState(null)
  const [selectedIcon, setSelectedIcon] = useState(null)
  const [search, setSearch] = useState(null)
  const [loading, setLoading] = useState(true)


  useEffect(() => {
    const handleClickOutside = (e) => {
        if(emojiMenuRef &&  buttonRef &&
          !emojiMenuRef.current.contains(e.target) && !buttonRef.current.contains(e.target)) {
            setShowEmojiMenu(false)
            console.log('clicked outside the emoji menu');
        }
    }

    window.addEventListener('mousedown', handleClickOutside)
    return () => window.removeEventListener('mousedown', handleClickOutside)
  },[])


  useEffect(() => {
    async function fetchAllCategories() {
      const allEmoji = {};

      for (const category of listOfCategories) {
        try {
          const res = await fetch(
            `https://emoji-api.com/categories/${category}?access_key=0d422d02ce5444d91ec090cf377fc0ea33172cab`
          );
          const data = await res.json();
          allEmoji[category] = data;
        } catch (err) {
          console.error(`Błąd dla kategorii ${category}`, err);
          allEmoji[category] = []; // fallback pusta tablica
        }
      }

      setEmojiByCategory(allEmoji);
      setLoading(false);
    }

    fetchAllCategories();
  }, []);

  return (
      <div ref={emojiMenuRef} className={`absolute left-[0px]  bg-white outline-1 rounded-[6px] py-1
                  outline-gray-300 shadow-xl shadow-gray-300 flex-col duration-150
                  ${showEmojiMenu ? "flex  opacity-100 top-[100px] pointer-events-auto" : 
                  "pointer-events-none opacity-0  top-[20px]"}`}
      >
        <div className="w-full h-full">
          <div className="w-full h-full flex px-3 border-b-1 border-gray-200 py-3 gap-2 justify-start items-center">
            <HugeiconsIcon icon={Search01Icon} className="text-gray-400" size={19} />
            {/* Emoji searcher */}
            <input className="placeholder:text-gray-400 font-light text-[14px] focus:outline-none
            text-gray-700" type="text" placeholder="Search..."
              onChange={(e) => {
                setSearch(e.target.value)
                
              }}
            />

          </div>

          <div className="flex-col flex w-[300px] justify-between">
            <div className="h-[200px] overflow-y-auto custom-scroll justify-center">
              {loading ? (
                <div className="text-gray-400 text-sm p-2">Loading emotes...</div>
              ) : (
                listOfCategories.map((category) => {
                  const allEmojis = emojiByCategory[category] || []

                  // jeśli istnieje search to filtrujemy
                  const filteredEmojis = search ? allEmojis.filter((emoji) => {
                    const iconName = emoji.unicodeName.split(" ").slice(1).join(" ")
                    return iconName.toLowerCase().includes(search.toLowerCase())
                  })
                  : allEmojis


                  // Skipujemy puste kategorie
                  if (filteredEmojis.length === 0) return null
                  
                  

                  return (
                    <div key={category} className="flex flex-col">
                      <div className="text-[13px] px-4 pt-3  capitalize text-gray-500 font-Inter font-semibold mb-1">{category}</div>
                      
                      <div className="flex gap-1 flex-wrap px-3">
                          {filteredEmojis.map((emoji) => {
                            const iconName = emoji.unicodeName.split(" ").slice(1).join(" ")

                            return (
                              <span key={emoji.unicodeName} className={`w-[30px] h-[30px] rounded-[4px] cursor-pointer
                              hover:bg-gray-200 flex justify-center items-center`}
                                onMouseEnter={() => {
                                  setHoveredEmojiName(iconName)
                                  setHoveredEmojiIcon(emoji.character)
                                }}

                                onClick={() => {
                                  addEmoji(emoji.character)
                                }}
                              >
                                  <span key={emoji.slug} className="text-[23px] select-none">{emoji.character}</span>
                              </span>
                            )
                          })}
                        
                      </div>
                    </div>
                  )
                })
              )}


            </div>
            <div className="w-full py-3 border-t-1 border-gray-200 flex justify-between items-center px-3">
              <div className="font-light text-[14px] focus:outline-none text-gray-400">
                {hoveredEmojiName && hoveredEmojiIcon ? <div className="text-gray-500 font-normal capitalize flex
                justify-center items-center gap-1">
                  <span className="text-[20px]">{hoveredEmojiIcon}</span>
                  {hoveredEmojiName}</div> 
                : "Select emoji.."}
              </div>
              {/* <div className="w-[25px] h-[25px] hover:bg-gray-50 hover:outline-1 outline-gray-200 
              flex justify-center items-center rounded-[3px] cursor-pointer">👋</div> */}
            </div>
          </div>

            {/* {listOfCategories.map((category) => (
              <div key={category} className="px-2  py-1 rounded-[4px] bg-white shadow-xl shadow-gray-300 outline-1
              outline-gray-200 text-gray-800 text-[13px] hover:bg-gray-50 cursor-pointer">{category}</div>
            ))}

            <div className="flex flex-wrap">
              {emojis?.map(emoji => (
                <span key={emoji.slug}  className="text-2xl m-1">{emoji.character}</span>
              ))}
            </div> */}
          
        </div>  
      
    </div>

  );
}