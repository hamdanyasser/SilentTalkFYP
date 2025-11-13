/**
 * Rich Text Editor Component
 *
 * A simple rich text editor with formatting toolbar for forum posts and replies.
 * Supports basic formatting (bold, italic, underline, lists, links, code blocks).
 */

import React, { useRef, useState, useCallback } from 'react'
import { Stack } from '../../design-system'
import './RichTextEditor.css'

export interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: number
  maxHeight?: number
  disabled?: boolean
  className?: string
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write your message...',
  minHeight = 150,
  maxHeight = 500,
  disabled = false,
  className = '',
}) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)

  // Execute formatting command
  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
  }, [])

  // Handle content change
  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }, [onChange])

  // Handle paste - strip formatting
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
  }, [])

  // Toolbar buttons configuration
  const toolbarButtons = [
    {
      icon: '𝐁',
      title: 'Bold',
      command: 'bold',
      ariaLabel: 'Bold',
    },
    {
      icon: '𝐼',
      title: 'Italic',
      command: 'italic',
      ariaLabel: 'Italic',
    },
    {
      icon: 'U̲',
      title: 'Underline',
      command: 'underline',
      ariaLabel: 'Underline',
    },
    {
      icon: 'S̶',
      title: 'Strikethrough',
      command: 'strikeThrough',
      ariaLabel: 'Strikethrough',
    },
    {
      icon: '•',
      title: 'Bullet List',
      command: 'insertUnorderedList',
      ariaLabel: 'Insert unordered list',
    },
    {
      icon: '1.',
      title: 'Numbered List',
      command: 'insertOrderedList',
      ariaLabel: 'Insert ordered list',
    },
    {
      icon: '< >',
      title: 'Code Block',
      command: 'formatBlock',
      value: '<pre>',
      ariaLabel: 'Insert code block',
    },
    {
      icon: '"',
      title: 'Quote',
      command: 'formatBlock',
      value: '<blockquote>',
      ariaLabel: 'Insert quote',
    },
  ]

  // Insert link
  const insertLink = useCallback(() => {
    const url = prompt('Enter URL:')
    if (url) {
      execCommand('createLink', url)
    }
  }, [execCommand])

  return (
    <div className={`rich-text-editor ${isFocused ? 'focused' : ''} ${className}`}>
      {/* Toolbar */}
      <div className="rich-text-editor__toolbar" role="toolbar" aria-label="Text formatting">
        <Stack gap={1} direction="horizontal" wrap>
          {toolbarButtons.map((button, index) => (
            <button
              key={index}
              type="button"
              className="rich-text-editor__toolbar-button"
              onClick={() => execCommand(button.command, button.value)}
              disabled={disabled}
              title={button.title}
              aria-label={button.ariaLabel}
            >
              {button.icon}
            </button>
          ))}
          <button
            type="button"
            className="rich-text-editor__toolbar-button"
            onClick={insertLink}
            disabled={disabled}
            title="Insert Link"
            aria-label="Insert link"
          >
            🔗
          </button>
        </Stack>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        className="rich-text-editor__content"
        contentEditable={!disabled}
        onInput={handleInput}
        onPaste={handlePaste}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        dangerouslySetInnerHTML={{ __html: value }}
        style={{ minHeight: `${minHeight}px`, maxHeight: `${maxHeight}px` }}
        role="textbox"
        aria-multiline="true"
        aria-label="Rich text editor"
        data-placeholder={placeholder}
      />
    </div>
  )
}

export default RichTextEditor
