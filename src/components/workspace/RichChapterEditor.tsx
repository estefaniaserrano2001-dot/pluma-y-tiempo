import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import FontFamily from '@tiptap/extension-font-family';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Minus,
  Undo,
  Redo,
  Image as ImageIcon,
  Link as LinkIcon,
  Highlighter,
  Palette,
  Maximize2,
  ChevronDown,
  X,
  Upload,
  Check,
} from 'lucide-react';
import { getTheme } from '../../utils/theme';
import { PaletteTheme } from '../../types';

interface RichChapterEditorProps {
  initialContent: string;
  onChange: (htmlContent: string, plainText: string) => void;
  palette: PaletteTheme;
  darkMode: boolean;
  onTextSelected?: (selectedText: string) => void;
}

const FONT_FAMILIES = [
  { label: 'Lora (Novela / Clásica)', value: "'Lora', serif" },
  { label: 'Sans (Moderna / Limpia)', value: "'Plus Jakarta Sans', sans-serif" },
  { label: 'Cinzel (Épica / Portadas)', value: "'Cinzel', serif" },
  { label: 'Monospace (Borrador / Guion)', value: 'monospace' },
  { label: 'Georgia (Editorial)', value: 'Georgia, serif' },
];

const FONT_SIZES = [
  { label: '14px', value: '14px' },
  { label: '16px', value: '16px' },
  { label: '18px (Estándar)', value: '18px' },
  { label: '20px', value: '20px' },
  { label: '24px (Grande)', value: '24px' },
  { label: '28px', value: '28px' },
  { label: '32px (Título)', value: '32px' },
];

const HIGHLIGHT_COLORS = [
  { name: 'Amarillo', hex: '#FEF08A' },
  { name: 'Verde Salvia', hex: '#BBF7D0' },
  { name: 'Celeste', hex: '#BAE6FD' },
  { name: 'Lila', hex: '#E9D5FF' },
  { name: 'Melocotón', hex: '#FED7AA' },
  { name: 'Rosa Pálido', hex: '#FBCFE8' },
];

const TEXT_COLORS = [
  { name: 'Predeterminado', hex: 'inherit' },
  { name: 'Carbón', hex: '#1C1917' },
  { name: 'Esmeralda', hex: '#1E3A2B' },
  { name: 'Azul Marino', hex: '#1B3B5C' },
  { name: 'Terracota', hex: '#933D2D' },
  { name: 'Violeta', hex: '#583778' },
  { name: 'Gris Grafito', hex: '#57534E' },
];

export const RichChapterEditor: React.FC<RichChapterEditorProps> = ({
  initialContent,
  onChange,
  palette,
  darkMode,
  onTextSelected,
}) => {
  const theme = getTheme(palette, darkMode);

  const [selectedFont, setSelectedFont] = useState(FONT_FAMILIES[0].value);
  const [selectedFontSize, setSelectedFontSize] = useState('18px');
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageAlignment, setImageAlignment] = useState<'left' | 'center' | 'right'>('center');
  const [imageWidth, setImageWidth] = useState<'25%' | '50%' | '75%' | '100%'>('50%');
  const [imageCaption, setImageCaption] = useState('');
  const [tempImageDataUrl, setTempImageDataUrl] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextStyle,
      Color,
      FontFamily,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: initialContent || '<p></p>',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText();
      onChange(html, text);
    },
    onSelectionUpdate: ({ editor }) => {
      if (onTextSelected) {
        const { from, to } = editor.state.selection;
        const text = editor.state.doc.textBetween(from, to, ' ');
        onTextSelected(text);
      }
    },
  });

  // Sync initial content if chapter changes externally
  const prevChapterContent = useRef(initialContent);
  useEffect(() => {
    if (editor && initialContent !== prevChapterContent.current) {
      if (initialContent !== editor.getHTML()) {
        editor.commands.setContent(initialContent || '<p></p>');
      }
      prevChapterContent.current = initialContent;
    }
  }, [initialContent, editor]);

  if (!editor) return null;

  // Insert Image into document
  const handleInsertImage = () => {
    if (!tempImageDataUrl) return;

    // Insert image with custom width and alignment via HTML or tiptap command
    const figureHtml = `
      <figure class="my-4 text-${imageAlignment}" style="text-align: ${imageAlignment};">
        <img src="${tempImageDataUrl}" alt="${imageCaption}" style="width: ${imageWidth}; display: inline-block; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />
        ${imageCaption ? `<figcaption style="font-size: 12px; color: #78716c; font-style: italic; margin-top: 6px;">${imageCaption}</figcaption>` : ''}
      </figure>
      <p></p>
    `;

    editor.chain().focus().insertContent(figureHtml).run();
    setShowImageModal(false);
    setTempImageDataUrl('');
    setImageCaption('');
  };

  // Handle local file image upload for inline editor
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setTempImageDataUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleLinkPrompt = () => {
    const prevUrl = editor.getAttributes('link').href;
    const url = window.prompt('Introduce la dirección URL:', prevUrl || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-col h-full rounded-2xl border overflow-hidden shadow-xs border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
      {/* WORD / DOCS STYLE TOOLBAR */}
      <div
        className={`p-2 border-b flex flex-wrap items-center gap-1.5 select-none sticky top-0 z-20 ${theme.bgSidebar} ${theme.borderSidebar}`}
      >
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 pr-1 border-r border-stone-300 dark:border-stone-700">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30"
            title="Deshacer (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30"
            title="Rehacer (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>

        {/* Headings Dropdown */}
        <div className="flex items-center gap-1 pr-1 border-r border-stone-300 dark:border-stone-700">
          <select
            value={
              editor.isActive('heading', { level: 1 })
                ? 'h1'
                : editor.isActive('heading', { level: 2 })
                ? 'h2'
                : editor.isActive('heading', { level: 3 })
                ? 'h3'
                : 'p'
            }
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'h1') editor.chain().focus().toggleHeading({ level: 1 }).run();
              else if (val === 'h2') editor.chain().focus().toggleHeading({ level: 2 }).run();
              else if (val === 'h3') editor.chain().focus().toggleHeading({ level: 3 }).run();
              else editor.chain().focus().setParagraph().run();
            }}
            className="px-2 py-1 rounded-lg border text-xs font-semibold bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 border-stone-300 dark:border-stone-700 focus:outline-none"
          >
            <option value="p">Párrafo normal</option>
            <option value="h1">Título 1 (Capítulo)</option>
            <option value="h2">Título 2 (Sección)</option>
            <option value="h3">Título 3 (Subsección)</option>
          </select>
        </div>

        {/* Font Family Dropdown */}
        <div className="flex items-center gap-1 pr-1 border-r border-stone-300 dark:border-stone-700">
          <select
            value={selectedFont}
            onChange={(e) => {
              const font = e.target.value;
              setSelectedFont(font);
              editor.chain().focus().setFontFamily(font).run();
            }}
            className="px-2 py-1 rounded-lg border text-xs font-medium bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 border-stone-300 dark:border-stone-700 focus:outline-none max-w-[140px] truncate"
            title="Familia tipográfica"
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Basic Text Formats: Bold, Italic, Underline, Strikethrough */}
        <div className="flex items-center gap-0.5 pr-1 border-r border-stone-300 dark:border-stone-700">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded-lg transition-all ${
              editor.isActive('bold')
                ? `${theme.activeTab} font-bold shadow-xs`
                : 'text-stone-600 dark:text-stone-300 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            title="Negrita (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded-lg transition-all ${
              editor.isActive('italic')
                ? `${theme.activeTab} font-bold shadow-xs`
                : 'text-stone-600 dark:text-stone-300 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            title="Cursiva (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded-lg transition-all ${
              editor.isActive('underline')
                ? `${theme.activeTab} font-bold shadow-xs`
                : 'text-stone-600 dark:text-stone-300 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            title="Subrayar (Ctrl+U)"
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1.5 rounded-lg transition-all ${
              editor.isActive('strike')
                ? `${theme.activeTab} font-bold shadow-xs`
                : 'text-stone-600 dark:text-stone-300 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            title="Tachado"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
        </div>

        {/* Text Color & Highlight */}
        <div className="flex items-center gap-1 pr-1 border-r border-stone-300 dark:border-stone-700 relative">
          {/* Highlight Color */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowHighlightPicker(!showHighlightPicker);
                setShowTextColorPicker(false);
              }}
              className={`p-1.5 rounded-lg flex items-center gap-0.5 transition-all ${
                editor.isActive('highlight')
                  ? 'bg-yellow-200 text-stone-900'
                  : 'text-stone-600 dark:text-stone-300 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              title="Resaltar texto con color"
            >
              <Highlighter className="w-4 h-4" />
              <ChevronDown className="w-2.5 h-2.5 opacity-60" />
            </button>

            {showHighlightPicker && (
              <div className="absolute left-0 mt-1 p-2 rounded-xl border shadow-xl bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 z-50 flex gap-1.5">
                {HIGHLIGHT_COLORS.map((hc) => (
                  <button
                    type="button"
                    key={hc.hex}
                    onClick={() => {
                      editor.chain().focus().toggleHighlight({ color: hc.hex }).run();
                      setShowHighlightPicker(false);
                    }}
                    className="w-5 h-5 rounded-full border border-stone-300 shadow-xs hover:scale-110 transition-transform"
                    style={{ backgroundColor: hc.hex }}
                    title={hc.name}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().unsetHighlight().run();
                    setShowHighlightPicker(false);
                  }}
                  className="text-[10px] px-1.5 py-0.5 rounded border text-stone-500 hover:bg-stone-100"
                >
                  Quitar
                </button>
              </div>
            )}
          </div>

          {/* Text Color */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowTextColorPicker(!showTextColorPicker);
                setShowHighlightPicker(false);
              }}
              className="p-1.5 rounded-lg flex items-center gap-0.5 text-stone-600 dark:text-stone-300 hover:bg-black/5 dark:hover:bg-white/5"
              title="Color de texto"
            >
              <Palette className="w-4 h-4" />
              <ChevronDown className="w-2.5 h-2.5 opacity-60" />
            </button>

            {showTextColorPicker && (
              <div className="absolute left-0 mt-1 p-2 rounded-xl border shadow-xl bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 z-50 flex gap-1.5">
                {TEXT_COLORS.map((tc) => (
                  <button
                    type="button"
                    key={tc.name}
                    onClick={() => {
                      if (tc.hex === 'inherit') {
                        editor.chain().focus().unsetColor().run();
                      } else {
                        editor.chain().focus().setColor(tc.hex).run();
                      }
                      setShowTextColorPicker(false);
                    }}
                    className="w-5 h-5 rounded-full border border-stone-300 shadow-xs hover:scale-110 transition-transform"
                    style={{ backgroundColor: tc.hex === 'inherit' ? '#000' : tc.hex }}
                    title={tc.name}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Alignment: Left, Center, Right, Justify */}
        <div className="flex items-center gap-0.5 pr-1 border-r border-stone-300 dark:border-stone-700">
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-1.5 rounded-lg ${
              editor.isActive({ textAlign: 'left' })
                ? `${theme.activeTab} shadow-xs`
                : 'text-stone-600 dark:text-stone-300 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            title="Alinear a la izquierda"
          >
            <AlignLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-1.5 rounded-lg ${
              editor.isActive({ textAlign: 'center' })
                ? `${theme.activeTab} shadow-xs`
                : 'text-stone-600 dark:text-stone-300 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            title="Alinear al centro"
          >
            <AlignCenter className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-1.5 rounded-lg ${
              editor.isActive({ textAlign: 'right' })
                ? `${theme.activeTab} shadow-xs`
                : 'text-stone-600 dark:text-stone-300 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            title="Alinear a la derecha"
          >
            <AlignRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={`p-1.5 rounded-lg ${
              editor.isActive({ textAlign: 'justify' })
                ? `${theme.activeTab} shadow-xs`
                : 'text-stone-600 dark:text-stone-300 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            title="Justificar texto"
          >
            <AlignJustify className="w-4 h-4" />
          </button>
        </div>

        {/* Lists & Quotes */}
        <div className="flex items-center gap-0.5 pr-1 border-r border-stone-300 dark:border-stone-700">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded-lg ${
              editor.isActive('bulletList')
                ? `${theme.activeTab} shadow-xs`
                : 'text-stone-600 dark:text-stone-300 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            title="Lista con viñetas"
          >
            <List className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded-lg ${
              editor.isActive('orderedList')
                ? `${theme.activeTab} shadow-xs`
                : 'text-stone-600 dark:text-stone-300 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            title="Lista numerada"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 rounded-lg ${
              editor.isActive('blockquote')
                ? `${theme.activeTab} shadow-xs`
                : 'text-stone-600 dark:text-stone-300 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            title="Cita en bloque"
          >
            <Quote className="w-4 h-4" />
          </button>
        </div>

        {/* Insert Image, Link, Horizontal Line */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowImageModal(true)}
            className="p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-1 text-xs font-semibold"
            title="Insertar ilustración o imagen en el texto"
          >
            <ImageIcon className="w-4 h-4" />
            <span className="hidden xl:inline">Imagen</span>
          </button>

          <button
            type="button"
            onClick={handleLinkPrompt}
            className={`p-1.5 rounded-lg ${
              editor.isActive('link')
                ? `${theme.activeTab} shadow-xs`
                : 'text-stone-600 dark:text-stone-300 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            title="Insertar enlace"
          >
            <LinkIcon className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-black/5 dark:hover:bg-white/5"
            title="Línea divisoria horizontal"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* DOCUMENT WRITING SHEET (Google Docs paper view) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-stone-100/60 dark:bg-stone-950/40">
        <div
          className={`w-full max-w-4xl min-h-[700px] p-8 sm:p-14 rounded-2xl shadow-sm border ${theme.bgCard} ${theme.borderCard} focus-within:ring-2 ${theme.activeRing} transition-all`}
          style={{ fontFamily: selectedFont }}
        >
          <EditorContent
            editor={editor}
            className={`prose prose-stone dark:prose-invert max-w-none focus:outline-none min-h-[550px] leading-relaxed text-stone-800 dark:text-stone-200 [&_p]:mb-4 [&_h1]:text-2xl [&_h1]:font-serif [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-serif [&_h3]:text-lg [&_blockquote]:border-l-4 [&_blockquote]:pl-4 [&_blockquote]:italic [&_figure]:my-4`}
          />
        </div>
      </div>

      {/* INSERT IMAGE MODAL */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 ${theme.bgCard} ${theme.borderCard}`}
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${theme.accentBadge} ${theme.accentBadgeText}`}>
                  <ImageIcon className="w-5 h-5" />
                </div>
                <h3 className={`font-serif font-bold text-base ${theme.textPrimary}`}>
                  Insertar Imagen en el Capítulo
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="p-1 text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* File upload */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Seleccionar imagen desde tu dispositivo *
                </label>
                <label className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-stone-400 cursor-pointer bg-stone-50 dark:bg-stone-900/40 transition-all">
                  {tempImageDataUrl ? (
                    <div className="relative">
                      <img
                        src={tempImageDataUrl}
                        alt="Preview"
                        className="max-h-40 rounded-xl shadow-xs"
                      />
                      <span className="text-[10px] text-stone-500 block text-center mt-1">
                        Haz clic para cambiar imagen
                      </span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-stone-400 mb-2" />
                      <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                        Cargar imagen (PNG, JPG, WebP)
                      </span>
                      <span className="text-[10px] text-stone-400 mt-0.5">
                        Se guardará de forma persistente en tu navegador
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageFileChange}
                  />
                </label>
              </div>

              {/* Caption */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Pie de imagen (opcional)
                </label>
                <input
                  type="text"
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  placeholder="Ej: Ilustración de la catedral antes del eclipse"
                  className={`w-full px-3 py-1.5 rounded-xl border text-xs ${theme.borderCard} ${theme.bgCard} ${theme.textPrimary} focus:outline-none`}
                />
              </div>

              {/* Width & Alignment */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Tamaño relativo
                  </label>
                  <select
                    value={imageWidth}
                    onChange={(e) => setImageWidth(e.target.value as any)}
                    className={`w-full px-2.5 py-1.5 rounded-xl border ${theme.borderCard} ${theme.bgCard} ${theme.textPrimary} focus:outline-none`}
                  >
                    <option value="25%">Pequeña (25%)</option>
                    <option value="50%">Mediana (50%)</option>
                    <option value="75%">Grande (75%)</option>
                    <option value="100%">Ancho completo (100%)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Alineación
                  </label>
                  <select
                    value={imageAlignment}
                    onChange={(e) => setImageAlignment(e.target.value as any)}
                    className={`w-full px-2.5 py-1.5 rounded-xl border ${theme.borderCard} ${theme.bgCard} ${theme.textPrimary} focus:outline-none`}
                  >
                    <option value="center">Centrada</option>
                    <option value="left">A la izquierda</option>
                    <option value="right">A la derecha</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowImageModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-black/5"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleInsertImage}
                  disabled={!tempImageDataUrl}
                  className={`px-5 py-2 rounded-xl text-xs font-semibold shadow-md transition-all ${theme.primaryBtn} disabled:opacity-40`}
                >
                  Insertar Imagen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
