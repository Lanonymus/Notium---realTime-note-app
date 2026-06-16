import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'


export default create(subscribeWithSelector(
    (set) => 
    {
        return {
            lastFontSize: 15,

            setLastFontSize: (size) => {set(() => {return {lastFontSize: size}})}
        }
    }
))