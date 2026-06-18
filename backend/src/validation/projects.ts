import { z } from "zod"


export const verifyTitle = z.object({
    title: z.string()
})

