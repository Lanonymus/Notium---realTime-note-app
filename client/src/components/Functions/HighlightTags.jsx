export function HighlightTags(message) {
  if(!message) return
  
  const words = message.split(/(\s+)/) // zachowuje spacje jako osobne elementy

  return words.map((word, i) => {
    if (word.startsWith('@')) {
      return (
        <span key={i} className="text-blue-500 bg-blue-50 px-[2px] py-[1px] rounded-[3px]">
          {word}
        </span>
      )
    }

    return <span key={i}>{word}</span>
  })
}
