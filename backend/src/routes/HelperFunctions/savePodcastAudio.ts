import { supabaseAdmin } from "../../db/supabaseAdmin.js";


export const savePodcastAudio = async (wavBuffer: Buffer, podcastId: string) => {
    try {

        if (!wavBuffer) throw new Error("No audio to save");

        const filePath = `podcasts/audio/${podcastId}.wav` 

        const { data, error } = await supabaseAdmin.storage
            .from("Notium_Media")
            .upload(filePath, wavBuffer, {
                contentType: "audio/wav",
                upsert: false
            });

        if(error) throw new Error("An error while trying to save audio: ", error);


        console.log("pomyślnie zapisano audio");
        


    } catch (error) {
        console.error("Error uploading audio:", error);
        throw new Error("An error while trying to save audio");
    }
}
