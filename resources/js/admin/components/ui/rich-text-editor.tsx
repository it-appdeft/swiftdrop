import { Bold, Heading1, Heading2, Heading3, Italic, List, ListOrdered, Pilcrow, Underline } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Lightweight dependency-free WYSIWYG editor built on `contentEditable` +
 * `document.execCommand`. Emits HTML. Supports headings, bold/italic/underline
 * (text weight), font family, font size and lists — enough for managing legal
 * copy without pulling in a heavy editor library.
 */

const FONT_FAMILIES = [
    { label: 'Default', value: '' },
    { label: 'Arial', value: 'Arial, sans-serif' },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'Times New Roman', value: "'Times New Roman', serif" },
    { label: 'Courier New', value: "'Courier New', monospace" },
    { label: 'Verdana', value: 'Verdana, sans-serif' },
];

const FONT_SIZES = [
    { label: 'Small', value: '2' },
    { label: 'Normal', value: '3' },
    { label: 'Large', value: '5' },
    { label: 'Huge', value: '7' },
];

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    className?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
    const ref = React.useRef<HTMLDivElement>(null);

    // Seed the editable region once on mount (and if the value is swapped in
    // from outside while the editor isn't focused) — never on every keystroke,
    // which would reset the caret.
    React.useEffect(() => {
        const el = ref.current;
        if (el && document.activeElement !== el && el.innerHTML !== value) {
            el.innerHTML = value ?? '';
        }
    }, [value]);

    const emit = () => onChange(ref.current?.innerHTML ?? '');

    const exec = (command: string, arg?: string) => {
        ref.current?.focus();
        document.execCommand(command, false, arg);
        emit();
    };

    return (
        <div className={cn('border-input bg-background overflow-hidden rounded-md border', className)}>
            {/* Toolbar */}
            <div className="border-border bg-muted/40 flex flex-wrap items-center gap-1 border-b p-1.5">
                <ToolbarButton onClick={() => exec('formatBlock', 'P')} title="Paragraph">
                    <Pilcrow className="size-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => exec('formatBlock', 'H1')} title="Heading 1">
                    <Heading1 className="size-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => exec('formatBlock', 'H2')} title="Heading 2">
                    <Heading2 className="size-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => exec('formatBlock', 'H3')} title="Heading 3">
                    <Heading3 className="size-4" />
                </ToolbarButton>

                <Divider />

                <ToolbarButton onClick={() => exec('bold')} title="Bold">
                    <Bold className="size-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => exec('italic')} title="Italic">
                    <Italic className="size-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => exec('underline')} title="Underline">
                    <Underline className="size-4" />
                </ToolbarButton>

                <Divider />

                <ToolbarButton onClick={() => exec('insertUnorderedList')} title="Bullet list">
                    <List className="size-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => exec('insertOrderedList')} title="Numbered list">
                    <ListOrdered className="size-4" />
                </ToolbarButton>

                <Divider />

                <select
                    aria-label="Font family"
                    defaultValue=""
                    onChange={(e) => {
                        if (e.target.value) exec('fontName', e.target.value);
                        e.target.selectedIndex = 0;
                    }}
                    className="border-input bg-background h-8 rounded-md border px-2 text-xs"
                >
                    <option value="" disabled>
                        Font
                    </option>
                    {FONT_FAMILIES.filter((f) => f.value).map((f) => (
                        <option key={f.label} value={f.value}>
                            {f.label}
                        </option>
                    ))}
                </select>

                <select
                    aria-label="Font size"
                    defaultValue=""
                    onChange={(e) => {
                        if (e.target.value) exec('fontSize', e.target.value);
                        e.target.selectedIndex = 0;
                    }}
                    className="border-input bg-background h-8 rounded-md border px-2 text-xs"
                >
                    <option value="" disabled>
                        Size
                    </option>
                    {FONT_SIZES.map((s) => (
                        <option key={s.value} value={s.value}>
                            {s.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Editable surface */}
            <div
                ref={ref}
                contentEditable
                suppressContentEditableWarning
                onInput={emit}
                onBlur={emit}
                data-placeholder={placeholder}
                className={cn(
                    'min-h-[260px] px-4 py-3 text-sm leading-relaxed focus:outline-none',
                    'empty:before:text-muted-foreground empty:before:pointer-events-none empty:before:content-[attr(data-placeholder)]',
                    // Visual styling for the formatting the toolbar applies.
                    '[&_h1]:mb-2 [&_h1]:text-2xl [&_h1]:font-bold',
                    '[&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-bold',
                    '[&_h3]:mb-1.5 [&_h3]:text-lg [&_h3]:font-semibold',
                    '[&_p]:mb-2',
                    '[&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-6',
                    '[&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-6',
                    '[&_a]:text-primary [&_a]:underline',
                )}
            />
        </div>
    );
}

function ToolbarButton({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
    return (
        <button
            type="button"
            title={title}
            aria-label={title}
            // Use onMouseDown + preventDefault so the editor keeps its selection.
            onMouseDown={(e) => {
                e.preventDefault();
                onClick();
            }}
            className="text-muted-foreground hover:bg-background hover:text-foreground flex size-8 items-center justify-center rounded-md transition"
        >
            {children}
        </button>
    );
}

function Divider() {
    return <span className="bg-border mx-1 h-5 w-px" />;
}
