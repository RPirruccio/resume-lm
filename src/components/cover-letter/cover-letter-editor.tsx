'use client'

import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect } from 'react'
import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
import Strike from '@tiptap/extension-strike'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { 
  Bold as BoldIcon, 
  Italic as ItalicIcon, 
  Strikethrough as StrikeIcon,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface CoverLetterEditorProps {
  initialData: Record<string, unknown>;
  onChange?: (data: Record<string, unknown>) => void;
  containerWidth: number;
}

function CoverLetterEditor({ initialData, onChange, containerWidth }: CoverLetterEditorProps) {
  // Calculate scale based on container width
  // 816 is our base width for a letter size paper (8.5 inches * 96 DPI)
  const scale = containerWidth / 60;

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right'],
      }),
    ],
    content: initialData?.content as string || '<p>Start writing your cover letter...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-xxs focus:outline-none h-full overflow-none max-w-none text-black',
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.({
        content: editor.getHTML(),
        lastUpdated: new Date().toISOString(),
      });
    }
  })

  // Update effect to handle partial updates
  useEffect(() => {
    if (editor && initialData?.content) {
      const currentContent = editor.getHTML()
      const newContent = initialData.content as string
      
      // Allow partial updates if new content is longer
      if (newContent !== currentContent) {
        editor.commands.setContent(newContent)
      }
    }
  }, [initialData?.content, editor])

  // Cleanup editor on unmount
  useEffect(() => {
    return () => {
      editor?.destroy()
    }
  }, [editor])

  return (
    <div className="relative w-full max-w-[816px] mx-auto bg-white shadow-lg rounded-lg overflow-hidden mb-12">
      {editor && (
        <BubbleMenu 
          editor={editor} 
          tippyOptions={{ duration: 100 }}
          className="flex overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md"
        >
          {/* Text Style */}
          <div className="flex items-center">
            <Button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={cn(
                "h-8 px-3 hover:bg-gray-100 transition-colors",
                editor.isActive('bold') && "bg-gray-100 text-gray-900"
              )}
              variant="ghost"
              size="sm"
            >
              <BoldIcon className="h-4 w-4" />
            </Button>
            
            <Button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={cn(
                "h-8 px-3 hover:bg-gray-100 transition-colors",
                editor.isActive('italic') && "bg-gray-100 text-gray-900"
              )}
              variant="ghost"
              size="sm"
            >
              <ItalicIcon className="h-4 w-4" />
            </Button>
            
            <Button
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={cn(
                "h-8 px-3 hover:bg-gray-100 transition-colors",
                editor.isActive('underline') && "bg-gray-100 text-gray-900"
              )}
              variant="ghost"
              size="sm"
            >
              <UnderlineIcon className="h-4 w-4" />
            </Button>
            
            <Button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={cn(
                "h-8 px-3 hover:bg-gray-100 transition-colors",
                editor.isActive('strike') && "bg-gray-100 text-gray-900"
              )}
              variant="ghost"
              size="sm"
            >
              <StrikeIcon className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="mx-1 h-8" />

          {/* Text Alignment */}
          <div className="flex items-center">
            <Button
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              className={cn(
                "h-8 px-3 hover:bg-gray-100 transition-colors",
                editor.isActive({ textAlign: 'left' }) && "bg-gray-100 text-gray-900"
              )}
              variant="ghost"
              size="sm"
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            
            <Button
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              className={cn(
                "h-8 px-3 hover:bg-gray-100 transition-colors",
                editor.isActive({ textAlign: 'center' }) && "bg-gray-100 text-gray-900"
              )}
              variant="ghost"
              size="sm"
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            
            <Button
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              className={cn(
                "h-8 px-3 hover:bg-gray-100 transition-colors",
                editor.isActive({ textAlign: 'right' }) && "bg-gray-100 text-gray-900"
              )}
              variant="ghost"
              size="sm"
            >
              <AlignRight className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="mx-1 h-8" />

          {/* Headings */}
          <div className="flex items-center">
            <Button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={cn(
                "h-8 px-3 hover:bg-gray-100 transition-colors",
                editor.isActive('heading', { level: 1 }) && "bg-gray-100 text-gray-900"
              )}
              variant="ghost"
              size="sm"
            >
              <Heading1 className="h-4 w-4" />
            </Button>
            
            <Button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={cn(
                "h-8 px-3 hover:bg-gray-100 transition-colors",
                editor.isActive('heading', { level: 2 }) && "bg-gray-100 text-gray-900"
              )}
              variant="ghost"
              size="sm"
            >
              <Heading2 className="h-4 w-4" />
            </Button>
          </div>
        </BubbleMenu>
      )}
      <div 
        className="relative pb-[129.41%]" // 11/8.5 = 1.2941
        style={{ aspectRatio: '8.5 / 11' }}
      >
        <div 
          className="absolute inset-0 origin-top-left"
          style={{
            transform: `scale(${scale})`,
            width: `${(100 / scale)}%`,
            height: `${(100 / scale)}%`,
          }}
        >
          <div className="absolute inset-0 p-16">
            <EditorContent 
              editor={editor} 
              className="h-full focus:outline-none prose prose-xxs max-w-none flex flex-col"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default CoverLetterEditor