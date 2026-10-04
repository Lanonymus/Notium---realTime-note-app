import { Editor } from "@tiptap/core";
import { getMediaUrl } from "../GetMediaUrl";





const handleImageFlashcards = async (file: File, editor: Editor, projectID: string) => {   
      
    if (!file || !editor || !projectID) {
      console.log("No file provided, editor not ready or missing projectID");
      return;
    }

    // 1. Czysta nazwa pliku bez prefiksów katalogu
    const fileName = `${Date.now()}_${file.name}`;
    const tempUrl = URL.createObjectURL(file);
    

    // 2. Wstawienie placeholderu z atrybutami docId i fileName
    editor
      .chain()
      .focus()
      .setImage({
        src: tempUrl,
        isUploading: true,
        progress: 0,
        docId: projectID,
        fileName: fileName
      } as any)
      .run();

    let nodePos: number | null = null;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "image" && node.attrs.src === tempUrl) {
        nodePos = pos;
        return false;
      }
    });

    const formData = new FormData();
    // 1. Najpierw pola tekstowe
    formData.append('fileName', fileName);
    formData.append('projectID', projectID);
    // 2. Na końcu plik
    formData.append('file', file);



    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://localhost:8000/api/upload-media', true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && nodePos !== null) {
        const percentComplete = (event.loaded / event.total) * 100;

        editor.state.doc.descendants((node, pos) => {
          if (node.type.name === "image" && node.attrs.src === tempUrl) {
            editor.commands.command(({ tr }) => {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                progress: percentComplete
              });
              return true;
            });
            return false;
          }
        });
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {

          // Używamy adresu zwróconego z backendu lub wygenerowanego z helpera
          const finalMediaUrl = getMediaUrl(projectID, fileName);

          editor.state.doc.descendants((node, pos) => {
            if (node.type.name === "image" && node.attrs.src === tempUrl) {
              editor.commands.command(({ tr }) => {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  src: finalMediaUrl,
                  isUploading: false,
                  progress: 100,
                  
                });
                return true;
              });
              return false;
            }
          });
        } catch (e) {
          console.error("Błąd podczas parsowania odpowiedzi serwera:", e);
        } finally {
          URL.revokeObjectURL(tempUrl);
        }
      } else {
        console.error("Błąd podczas wysyłania obrazu:", xhr.statusText);
        removeTempImage(tempUrl);
        URL.revokeObjectURL(tempUrl);
      }
    };

    xhr.onerror = () => {
      console.error("Error during sending an image");
      removeTempImage(tempUrl);
      URL.revokeObjectURL(tempUrl);
    };

    xhr.send(formData);

    function removeTempImage(targetUrl: string) {
      editor?.state.doc.descendants((node, pos) => {
        // Poprawiono: node.attrs.src zamiast node.attrs.str
        if (node.type.name === "image" && node.attrs.src === targetUrl) {
          editor.commands.deleteRange({ from: pos, to: pos + node.nodeSize });
          return false;
        }
      });
    }
  };


export default handleImageFlashcards;