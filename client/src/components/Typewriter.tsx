import { useState, useEffect } from "react";

type TypewriterProps = {
  text: string;
  speed?: number;
  delay?: number;
};

export function Typewriter({ text, speed = 40, delay = 0 }: TypewriterProps) {
    const [currentText, setCurrentText] = useState("")
    const [isDone, setIsDone ] = useState(false)

    useEffect(() => {

        const characters = Array.from(text)

        let interval: number | null = null
        let index = 0

        const timeout = setTimeout(() => {
            interval = setInterval(() => {
                if (index < characters.length) {
                    const charToAdd = characters[index]
                    setCurrentText((prev) => prev + charToAdd)     
                    index++                   
                } else {
                    setIsDone(true)
                    if (interval) clearInterval(interval)
                }
            }, speed)
        }, delay)


        return () => {
            clearTimeout(timeout)
        }
    }, [text, speed, delay])


    return (
        <span>
        {currentText}
        {!isDone && (
            <span className="inline-block w-[2px] h-[1em] bg-blue-500 ml-1 animate-pulse align-middle" />
        )}
        </span>
    );
}