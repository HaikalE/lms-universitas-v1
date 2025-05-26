import React, { useRef, useState, useCallback } from 'react';
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  StrikethroughIcon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
  CodeIcon,
  LinkIcon,
  ImageIcon,
  FileIcon,
  HighlighterIcon,
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
  AlignJustifyIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  TableIcon,
  SmileIcon,
  PaletteIcon,
  UndoIcon,
  RedoIcon,
  MaximizeIcon,
  MinimizeIcon
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
  maxHeight?: number;
  enableFileUpload?: boolean;
  enableImageUpload?: boolean;
  onFileUpload?: (file: File) => Promise<string>;
  onImageUpload?: (file: File) => Promise<string>;
}

interface ToolbarButton {
  icon: React.FC<any>;
  command: string;
  value?: string;
  tooltip: string;
  active?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Tulis sesuatu...',
  className = '',
  minHeight = 300,
  maxHeight = 600,
  enableFileUpload = true,
  enableImageUpload = true,
  onFileUpload,
  onImageUpload
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [history, setHistory] = useState<string[]>([value]);
  const [historyStep, setHistoryStep] = useState(0);

  // Common emojis for quick access
  const commonEmojis = ['😊', '👍', '❤️', '🎉', '🤔', '👏', '😂', '🙏', '💡', '✅', '⭐', '🔥'];
  
  // Color palette
  const colorPalette = [
    '#000000', '#434343', '#666666', '#999999', '#cccccc', '#ffffff',
    '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#0000ff',
    '#9900ff', '#ff00ff', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3',
    '#d0e0e3', '#cfe2f3', '#d9d2e9', '#ead1dc'
  ];

  // Execute command
  const executeCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      updateHistory(editorRef.current.innerHTML);
    }
  }, [onChange]);

  // Update history for undo/redo
  const updateHistory = (content: string) => {
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(content);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  // Undo
  const handleUndo = () => {
    if (historyStep > 0) {
      const newStep = historyStep - 1;
      setHistoryStep(newStep);
      if (editorRef.current) {
        editorRef.current.innerHTML = history[newStep];
        onChange(history[newStep]);
      }
    }
  };

  // Redo
  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      const newStep = historyStep + 1;
      setHistoryStep(newStep);
      if (editorRef.current) {
        editorRef.current.innerHTML = history[newStep];
        onChange(history[newStep]);
      }
    }
  };

  // Insert link
  const insertLink = () => {
    const url = prompt('Masukkan URL:');
    if (url) {
      executeCommand('createLink', url);
    }
  };

  // Insert image
  const insertImage = async () => {
    if (!enableImageUpload || !onImageUpload) return;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const url = await onImageUpload(file);
          executeCommand('insertImage', url);
        } catch (error) {
          alert('Gagal mengunggah gambar');
        }
      }
    };
    input.click();
  };

  // Insert file
  const insertFile = async () => {
    if (!enableFileUpload || !onFileUpload) return;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const url = await onFileUpload(file);
          const link = `<a href="${url}" target="_blank" class="text-blue-600 hover:underline">📎 ${file.name}</a>`;
          executeCommand('insertHTML', link);
        } catch (error) {
          alert('Gagal mengunggah file');
        }
      }
    };
    input.click();
  };

  // Insert table
  const insertTable = () => {
    const rows = prompt('Jumlah baris:', '3');
    const cols = prompt('Jumlah kolom:', '3');
    if (rows && cols) {
      let table = '<table class="border-collapse border border-gray-300 my-2"><tbody>';
      for (let i = 0; i < parseInt(rows); i++) {
        table += '<tr>';
        for (let j = 0; j < parseInt(cols); j++) {
          table += '<td class="border border-gray-300 px-2 py-1">Cell</td>';
        }
        table += '</tr>';
      }
      table += '</tbody></table>';
      executeCommand('insertHTML', table);
    }
  };

  // Toolbar groups
  const toolbarGroups = [
    // Text formatting
    [
      { icon: BoldIcon, command: 'bold', tooltip: 'Bold (Ctrl+B)' },
      { icon: ItalicIcon, command: 'italic', tooltip: 'Italic (Ctrl+I)' },
      { icon: UnderlineIcon, command: 'underline', tooltip: 'Underline (Ctrl+U)' },
      { icon: StrikethroughIcon, command: 'strikeThrough', tooltip: 'Strikethrough' },
    ],
    // Headings
    [
      { icon: Heading1Icon, command: 'formatBlock', value: 'h1', tooltip: 'Heading 1' },
      { icon: Heading2Icon, command: 'formatBlock', value: 'h2', tooltip: 'Heading 2' },
      { icon: Heading3Icon, command: 'formatBlock', value: 'h3', tooltip: 'Heading 3' },
    ],
    // Lists
    [
      { icon: ListIcon, command: 'insertUnorderedList', tooltip: 'Bullet List' },
      { icon: ListOrderedIcon, command: 'insertOrderedList', tooltip: 'Numbered List' },
      { icon: QuoteIcon, command: 'formatBlock', value: 'blockquote', tooltip: 'Quote' },
      { icon: CodeIcon, command: 'formatBlock', value: 'pre', tooltip: 'Code Block' },
    ],
    // Alignment
    [
      { icon: AlignLeftIcon, command: 'justifyLeft', tooltip: 'Align Left' },
      { icon: AlignCenterIcon, command: 'justifyCenter', tooltip: 'Align Center' },
      { icon: AlignRightIcon, command: 'justifyRight', tooltip: 'Align Right' },
      { icon: AlignJustifyIcon, command: 'justifyFull', tooltip: 'Justify' },
    ],
    // Insert elements
    [
      { icon: LinkIcon, command: 'link', tooltip: 'Insert Link' },
      { icon: ImageIcon, command: 'image', tooltip: 'Insert Image' },
      { icon: FileIcon, command: 'file', tooltip: 'Attach File' },
      { icon: TableIcon, command: 'table', tooltip: 'Insert Table' },
    ],
    // Other tools
    [
      { icon: HighlighterIcon, command: 'hiliteColor', value: 'yellow', tooltip: 'Highlight' },
      { icon: PaletteIcon, command: 'color', tooltip: 'Text Color' },
      { icon: SmileIcon, command: 'emoji', tooltip: 'Insert Emoji' },
    ],
    // History
    [
      { icon: UndoIcon, command: 'undo', tooltip: 'Undo (Ctrl+Z)' },
      { icon: RedoIcon, command: 'redo', tooltip: 'Redo (Ctrl+Y)' },
    ],
  ];

  // Handle toolbar button click
  const handleToolbarClick = (button: ToolbarButton) => {
    switch (button.command) {
      case 'link':
        insertLink();
        break;
      case 'image':
        insertImage();
        break;
      case 'file':
        insertFile();
        break;
      case 'table':
        insertTable();
        break;
      case 'emoji':
        setShowEmojiPicker(!showEmojiPicker);
        break;
      case 'color':
        setShowColorPicker(!showColorPicker);
        break;
      case 'undo':
        handleUndo();
        break;
      case 'redo':
        handleRedo();
        break;
      default:
        executeCommand(button.command, button.value);
    }
  };

  // Handle emoji insert
  const insertEmoji = (emoji: string) => {
    executeCommand('insertText', emoji);
    setShowEmojiPicker(false);
  };

  // Handle color change
  const changeColor = (color: string) => {
    executeCommand('foreColor', color);
    setShowColorPicker(false);
  };

  // Handle content change
  const handleContentChange = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      updateHistory(editorRef.current.innerHTML);
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  return (
    <div className={`rich-text-editor ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''} ${className}`}>
      {/* Toolbar */}
      <Card className="rounded-b-none border-b-0">
        <div className="p-2 flex flex-wrap gap-2 items-center border-b bg-gray-50">
          {toolbarGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="flex items-center gap-1">
              {group.map((button, buttonIndex) => (
                <Button
                  key={buttonIndex}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToolbarClick(button)}
                  className="p-1 hover:bg-gray-200 transition-colors"
                  title={button.tooltip}
                >
                  <button.icon className="h-4 w-4" />
                </Button>
              ))}
              {groupIndex < toolbarGroups.length - 1 && (
                <div className="w-px h-6 bg-gray-300 mx-1" />
              )}
            </div>
          ))}
          
          {/* Fullscreen toggle */}
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1 hover:bg-gray-200 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <MinimizeIcon className="h-4 w-4" /> : <MaximizeIcon className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="absolute z-10 bg-white border rounded-lg shadow-lg p-3 mt-1">
            <div className="grid grid-cols-6 gap-2">
              {commonEmojis.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => insertEmoji(emoji)}
                  className="text-2xl hover:bg-gray-100 rounded p-1 transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Color Picker */}
        {showColorPicker && (
          <div className="absolute z-10 bg-white border rounded-lg shadow-lg p-3 mt-1">
            <div className="grid grid-cols-6 gap-2">
              {colorPalette.map((color, index) => (
                <button
                  key={index}
                  onClick={() => changeColor(color)}
                  className="w-8 h-8 rounded border border-gray-300 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Editor Content */}
      <Card className="rounded-t-none">
        <div
          ref={editorRef}
          contentEditable
          className="p-4 focus:outline-none prose prose-sm max-w-none"
          style={{
            minHeight: `${minHeight}px`,
            maxHeight: isFullscreen ? 'calc(100vh - 100px)' : `${maxHeight}px`,
            overflowY: 'auto'
          }}
          onInput={handleContentChange}
          onPaste={handlePaste}
          dangerouslySetInnerHTML={{ __html: value }}
          data-placeholder={placeholder}
        />
      </Card>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 text-xs text-gray-600 border-t">
        <div>
          {selectedText && <span>Selected: {selectedText.length} characters</span>}
        </div>
        <div>
          <span>Total: {value.replace(/<[^>]*>/g, '').length} characters</span>
        </div>
      </div>

      {/* Styles for editor content */}
      <style>{`
        .rich-text-editor [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          position: absolute;
        }
        
        .rich-text-editor .prose {
          color: #1f2937;
        }
        
        .rich-text-editor .prose h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 0.67em 0;
        }
        
        .rich-text-editor .prose h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.83em 0;
        }
        
        .rich-text-editor .prose h3 {
          font-size: 1.17em;
          font-weight: bold;
          margin: 1em 0;
        }
        
        .rich-text-editor .prose blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1em;
          margin: 1em 0;
          color: #6b7280;
        }
        
        .rich-text-editor .prose pre {
          background-color: #f3f4f6;
          padding: 1em;
          border-radius: 0.375rem;
          overflow-x: auto;
          font-family: monospace;
        }
        
        .rich-text-editor .prose table {
          border-collapse: collapse;
          margin: 1em 0;
        }
        
        .rich-text-editor .prose table td,
        .rich-text-editor .prose table th {
          border: 1px solid #e5e7eb;
          padding: 0.5em;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;