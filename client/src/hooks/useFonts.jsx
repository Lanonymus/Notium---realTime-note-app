import { useEffect, useState } from "react";


const API_KEY = "AIzaSyC49FLVp0dvjjHmcUpir8OoDHSM4GwoRV8"
const Link = `https://www.googleapis.com/webfonts/v1/webfonts?key=${API_KEY}&sort=popularity`
const fontsAmount = 100

export default function useFonts() {
    const [fonts, setFonts] = useState(null)

    useEffect(() => {
        const fetchFonts = async () => {
            try {
                const response = await fetch(Link)
                const data = await response.json()

                const fontsData = {}
                data.items.slice(0, fontsAmount).forEach(family => {
                    fontsData[family.family] = {
                        variants: family.variants,
                        fonts: family.files
                    }
                    // console.log(family.files);
                    
                })
                setFonts(fontsData)

            } catch (e) {
                console.error(e)
            }
        }

        fetchFonts()
    },[])

    return fonts

    // fetch(Link)
    //     .then(response => response.json())
    //     .then(data => {
    //         data.items.slice(0, 5).map((family) => {
    //             // console.log(
    //             //     "Font name: ", family.family,
    //             //     "variants: ", family.variants,
    //             //     "fonts: ", family.files

    //             // )
    //             const fontName = family.family
    //             const variants = family.variants
    //             const fonts = family.files

    //             fontsObjects[fontName] = {
    //                 variants: variants,
    //                 fonts: fonts
    //             }
                
    //         });
    //         console.log(fontsObjects);
    //         return fontsObjects
    //     }) 
    //     .catch(error => console.log(error))

    // // random font
}


