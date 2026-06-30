import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config()


const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE;

if(!supabaseUrl || !supabaseServiceRole ) {
    throw new Error("Missing environment variables for Supabase")
}


export const supabaseAdmin = createClient(
    supabaseUrl,
    supabaseServiceRole,
    {
        auth: {
            persistSession: false
        }
    }
)


