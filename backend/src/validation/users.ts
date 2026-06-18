import { z } from 'zod'

export const userIdSchema = z.object({
    id: z.coerce.number().int()
})

export const userRegisterSchema = z.object({
    username: z.string().min(3, "Nazwa użytkownika musi zawierać co najmniej 3 znaki"),
    email: z.string().email("Email musi zawierać co najmniej 3 znaki"),
    password: z.string().min(3, "Hasło musi zawierać co najmniej 3 znaki"),
})

export const userLoginSchema = z.object({
    email: z.string().email(),
    password: z.string()
})