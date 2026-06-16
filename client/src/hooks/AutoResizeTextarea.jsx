// AutoResizeTextarea.tsx
import React, { useEffect } from 'react'

// forwardRef pozwala przekazać ref z zewnątrz do <textarea>
const AutoResizeTextarea = React.forwardRef(({ value, ...props }, ref) => {
  useEffect(() => {
    const textarea = ref?.current
    if (!textarea) return

    const resize = () => {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }

    resize()
    textarea.addEventListener('input', resize)
    return () => textarea.removeEventListener('input', resize)
  }, [value, ref])

  return <textarea value={value} ref={ref} {...props} />
})

export default AutoResizeTextarea
