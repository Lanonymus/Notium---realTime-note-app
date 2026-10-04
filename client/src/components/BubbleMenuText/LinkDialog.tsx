import { FormEvent, useState } from 'react'
import { Editor } from '@tiptap/core'
import { Link2, Unlink, ExternalLink } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"

type LinkDialogProps = {
  editor: Editor
}

export const LinkDialog = ({ editor }: LinkDialogProps) => {
  const [url, setUrl] = useState<string>('')
  const [isOpen, setIsOpen] = useState<boolean>(false)

  const isLinkActive = editor.isActive('link')

  const handleOpenChange = (open: boolean) => {
    if (open) {
      const existingHref = editor.getAttributes('link').href || ''
      setUrl(existingHref)
    }

    setIsOpen(open)
  }

  const handleApplyLink = (e: React.FormEvent) => {
    e?.preventDefault()

    // jeżeli ktoś usunał zawartość linka
    if(!url.trim()) {
      handleRemoveLink()
      return
    } 


    let formattedUrl = url.trim()
    // jeżeli link zaczyna się od https lub http lub ściezkie względnej / lub od mailto
    if(
      !/^https?:\/\//i.test(formattedUrl) &&
      !url.startsWith('/') &&
      !url.startsWith('mailto:')  
    ) {
      formattedUrl = `https://${formattedUrl}`
    }

    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: formattedUrl})
      .run()


    setIsOpen(false)
  }


  const handleRemoveLink = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
    setUrl('')
    setIsOpen(false)
  }




  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      
      <DialogTrigger render={
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          title={isLinkActive ? "Edit link" : "Add link"}
          className={`w-[30px] h-[30px] rounded-md flex items-center justify-center transition-all border cursor-pointer ${
            isLinkActive
              ? "bg-gray-100 border-gray-300 text-gray-900"
              : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          <Link2 size={16} className="stroke-[1.75] rotate-[-45deg]" />
        </button>
      }>

      </DialogTrigger>

      <DialogContent 
        onMouseDown={(e) => e.stopPropagation()} 
        className="sm:max-w-[380px] rounded-lg border border-gray-200 bg-white shadow-lg text-gray-900 gap-4"
      >
        <form onSubmit={handleApplyLink} className="flex flex-col gap-4">

          <DialogHeader className="gap-1 text-left px-1 pt-1">
            <DialogTitle className="text-base font-semibold text-gray-900">
              {isLinkActive ? 'Edit link' : 'Add link'}
            </DialogTitle>

            <DialogDescription className="text-xs text-gray-500">
              Enter a web address to attach to the selected text.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-1.5 px-1">
            <label htmlFor="url-input" className="text-[11px] font-semibold text-gray-400 tracking-wider uppercase">
              URL Address
            </label>
            <div className="relative flex items-center">
              <input
                id="url-input"
                type="text"
                autoFocus
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-colors text-gray-900 placeholder:text-gray-400"
              />
              {url && (
                <a
                  href={url.startsWith('http') ? url : `https://${url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute right-2.5 p-1 text-gray-400 hover:text-gray-700 transition-colors"
                  title="Test link in new tab"
                >
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between gap-2 py-3">
            {isLinkActive ? (
              <button
                type="button"
                onClick={handleRemoveLink}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors border border-transparent hover:border-red-100"
              >
                <Unlink size={14} />
                Remove
              </button>
            ) : <div />}

            <div className="flex items-center gap-2 ml-auto">
              <DialogClose render={
                <button
                  type="button"
                  className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
              }>
              </DialogClose>
              
              <button
                type="submit"
                className="px-3.5 py-1.5 text-xs font-medium bg-gray-900 hover:bg-gray-800 text-white rounded-md transition-colors shadow-xs cursor-pointer"
              >
                {isLinkActive ? 'Save' : 'Add link'}
              </button>
            </div>
            
          </DialogFooter>
        </form>
      </DialogContent>


    </Dialog>
  )
}