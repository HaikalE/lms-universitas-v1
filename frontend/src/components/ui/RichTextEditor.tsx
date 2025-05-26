import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  ListBulletIcon,
  NumberedListIcon,
  LinkIcon,
  PhotoIcon,
  CodeBracketIcon,
  ChatBubbleBottomCenterTextIcon
} from '@heroicons/react/24/outline';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  disabled?: boolean;
  showToolbar?: boolean;
  allowImages?: boolean;
  allowLinks?: boolean;
  className?: string;
  onImageUpload?: (file: File) => Promise<string>;
}

interface EditorCommand {
  command: string;
  value?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start typing...',
  minHeight = 200,
  maxHeight = 500,
  disabled = false,
  showToolbar = true,
  allowImages = true,
  allowLinks = true,
  className = '',
  onImageUpload
}) => {
  const [isActive, setIsActive] = useState(false);
  const [currentSelection, setCurrentSelection] = useState<Selection | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  // Handle content changes
  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html);
    }
  }, [onChange]);

  // Execute editor command
  const executeCommand = useCallback((command: EditorCommand) => {
    if (disabled) return;
    
    // Restore selection if it exists
    if (currentSelection) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(currentSelection.getRangeAt(0));
      }
    }

    document.execCommand(command.command, false, command.value);
    editorRef.current?.focus();
    handleInput();
  }, [disabled, currentSelection, handleInput]);

  // Save current selection
  const saveSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      setCurrentSelection(selection);
    }
  }, []);

  // Handle toolbar button clicks
  const handleToolbarAction = useCallback((action: string, value?: string) => {
    switch (action) {
      case 'bold':
        executeCommand({ command: 'bold' });
        break;
      case 'italic':
        executeCommand({ command: 'italic' });
        break;
      case 'underline':
        executeCommand({ command: 'underline' });
        break;
      case 'insertUnorderedList':
        executeCommand({ command: 'insertUnorderedList' });
        break;
      case 'insertOrderedList':
        executeCommand({ command: 'insertOrderedList' });
        break;
      case 'blockquote':
        executeCommand({ command: 'formatBlock', value: 'blockquote' });
        break;
      case 'code':
        executeCommand({ command: 'formatBlock', value: 'pre' });
        break;
      case 'link':
        handleLinkInsertion();
        break;
      case 'image':
        handleImageInsertion();
        break;
      case 'removeFormat':
        executeCommand({ command: 'removeFormat' });
        break;
    }
  }, [executeCommand]);

  // Handle link insertion
  const handleLinkInsertion = useCallback(() => {
    const url = prompt('Enter URL:');
    if (url) {
      executeCommand({ command: 'createLink', value: url });
    }
  }, [executeCommand]);

  // Handle image insertion
  const handleImageInsertion = useCallback(() => {
    if (onImageUpload) {
      fileInputRef.current?.click();
    } else {
      const url = prompt('Enter image URL:');
      if (url) {
        executeCommand({ command: 'insertImage', value: url });
      }
    }
  }, [executeCommand, onImageUpload]);

  // Handle file upload
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onImageUpload) {
      try {
        const url = await onImageUpload(file);
        executeCommand({ command: 'insertImage', value: url });
      } catch (error) {
        console.error('Image upload failed:', error);
        alert('Failed to upload image');
      }
    }
    // Reset file input
    event.target.value = '';
  }, [executeCommand, onImageUpload]);

  // Handle paste events
  const handlePaste = useCallback((event: React.ClipboardEvent) => {
    event.preventDefault();
    const text = event.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    handleInput();
  }, [handleInput]);

  // Handle key events
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    // Handle tab for indentation
    if (event.key === 'Tab') {
      event.preventDefault();
      document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
      handleInput();
    }
    
    // Handle shortcuts
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'b':
          event.preventDefault();
          handleToolbarAction('bold');
          break;
        case 'i':
          event.preventDefault();
          handleToolbarAction('italic');
          break;
        case 'u':
          event.preventDefault();
          handleToolbarAction('underline');
          break;
        case 'k':
          if (allowLinks) {
            event.preventDefault();
            handleToolbarAction('link');
          }
          break;
      }
    }
  }, [handleInput, handleToolbarAction, allowLinks]);

  const toolbarButtons = [
    {
      action: 'bold',
      icon: BoldIcon,
      title: 'Bold (Ctrl+B)',
      shortcut: 'Ctrl+B'
    },
    {
      action: 'italic',
      icon: ItalicIcon,
      title: 'Italic (Ctrl+I)',
      shortcut: 'Ctrl+I'
    },
    {
      action: 'underline',
      icon: UnderlineIcon,
      title: 'Underline (Ctrl+U)',
      shortcut: 'Ctrl+U'
    },
    {
      action: 'insertUnorderedList',
      icon: ListBulletIcon,
      title: 'Bullet List'
    },
    {
      action: 'insertOrderedList',
      icon: NumberedListIcon,
      title: 'Numbered List'
    },
    {
      action: 'blockquote',
      icon: ChatBubbleBottomCenterTextIcon,
      title: 'Quote'
    },
    {
      action: 'code',
      icon: CodeBracketIcon,
      title: 'Code Block'
    }
  ];

  if (allowLinks) {
    toolbarButtons.push({
      action: 'link',
      icon: LinkIcon,
      title: 'Insert Link (Ctrl+K)',
      shortcut: 'Ctrl+K'
    });
  }

  if (allowImages) {
    toolbarButtons.push({
      action: 'image',
      icon: PhotoIcon,
      title: 'Insert Image'
    });
  }

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden ${isActive ? 'ring-2 ring-blue-500 border-blue-500' : ''} ${className}`}>
      {/* Toolbar */}
      {showToolbar && (
        <div className="bg-gray-50 border-b border-gray-300 px-3 py-2">
          <div className="flex items-center space-x-1">
            {toolbarButtons.map((button, index) => {
              const Icon = button.icon;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleToolbarAction(button.action)}
                  onMouseDown={(e) => e.preventDefault()} // Prevent editor from losing focus
                  disabled={disabled}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={button.title}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
            
            {/* Divider */}
            <div className="w-px h-6 bg-gray-300 mx-2" />
            
            {/* Remove formatting */}
            <button
              type="button"
              onClick={() => handleToolbarAction('removeFormat')}
              onMouseDown={(e) => e.preventDefault()}
              disabled={disabled}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Remove Formatting"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onFocus={() => setIsActive(true)}
        onBlur={() => {
          setIsActive(false);
          saveSelection();
        }}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        style={{
          minHeight: `${minHeight}px`,
          maxHeight: `${maxHeight}px`
        }}
        className={`
          p-4 outline-none overflow-y-auto
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          prose prose-sm max-w-none
          focus:outline-none
        `}
        data-placeholder={placeholder}
      />
      
      {/* Hidden file input for image uploads */}
      {allowImages && onImageUpload && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      )}
      
      {/* Character count */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <div className="flex space-x-4">
            <span>Rich text editor</span>
            {disabled && <span className="text-orange-600">Read-only</span>}
          </div>
          <span>
            {editorRef.current?.textContent?.length || 0} characters
          </span>
        </div>
      </div>
      
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          font-style: italic;
        }
        
        .prose blockquote {
          border-left: 4px solid #E5E7EB;
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: #6B7280;
        }
        
        .prose pre {
          background-color: #F3F4F6;
          padding: 1rem;
          border-radius: 0.375rem;
          overflow-x: auto;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
        }
        
        .prose ul, .prose ol {
          padding-left: 1.5rem;
        }
        
        .prose img {
          max-width: 100%;
          height: auto;
          border-radius: 0.375rem;
          margin: 1rem 0;
        }
        
        .prose a {
          color: #3B82F6;
          text-decoration: underline;
        }
        
        .prose a:hover {
          color: #1D4ED8;
        }
      `}</style>
    </div>
  );
};

// Export both default and named export to support both import patterns
export { RichTextEditor };
export default RichTextEditor;