import { ImageNodeView } from "@/components/ImageNodeView";
import { Image } from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";


export const CustomImage = Image.extend({

    name: "image",
    inline: true,
    group: 'inline',

    // * analogia - dodawanie funkcjonalności jak w samochodzie na pasku
    // rozdzielczym nowych czujników
    addAttributes() {
        return {
            // przepisanie / odziedziczenie atrybutów po rodzicu / rozszerzeniu Image
            ...this.parent?.(),
            alignment: {
                default: 'left',
                parseHTML: (element) => element.getAttribute('data-alignment') || 'left',
                renderHTML: (attributes) => ({
                'data-alignment': attributes.alignment,
                })
            },
            width: {
              default: "100%",
              renderHTML: (attributes) => {
                return {
                    width: attributes.width,
                    style: `width: ${attributes.width}`
                }
              }  
            },
            isUploading: {
                default: false,
                renderHTML: (attributes) => ({
                    'data-uploading': attributes.isUploading
                })
            },
            progress: {
                default: 0,
                renderHTML: (attributes) => ({
                    'data-progress': attributes.progress
                })
            },
            docId: {
                default: null
            },
            fileName: {
                default: null
            }
        }
    },

    // Renderowanie zamiast <img/> to <CustomImageNodeView />
    addNodeView() {
        return ReactNodeViewRenderer(ImageNodeView)
    }


})