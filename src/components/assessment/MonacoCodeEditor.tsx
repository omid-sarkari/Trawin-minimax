'use client'

/**
 * Monaco-based coding editor (p3.md §38).
 *
 * Layout contract enforced by the parent renderer: question statement and
 * examples appear BEFORE this component — never inside it.
 */

import Editor, { Monaco, loader } from '@monaco-editor/react'

// Pin a specific monaco build so workers + language services (HTML/CSS/TS)
// load reliably; the default implicit version can silently miss workers,
// which disables ALL IntelliSense.
void loader.config({
  paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs' },
})

interface MonacoCodeEditorProps {
  value: string
  onChange: (next: string) => void
  language?: string | null
  height?: number
}

/** Maps Trawin language slugs to Monaco language ids. */
function monacoLanguage(language?: string | null): string {
  switch ((language ?? '').toLowerCase()) {
    case 'javascript':
      return 'javascript'
    case 'typescript':
      return 'typescript'
    case 'html':
      return 'html'
    case 'css':
    case 'tailwindcss':
      return 'css'
    case 'python':
      return 'python'
    default:
      return 'javascript'
  }
}

function defineTheme(monaco: Monaco): void {
  monaco.editor.defineTheme('trawin-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '52525b', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'a3e635' },
      { token: 'string', foreground: '86efac' },
      { token: 'number', foreground: 'fbbf24' },
    ],
    colors: {
      'editor.background': '#09090b',
      'editor.lineHighlightBackground': '#ffffff08',
      'editorLineNumber.foreground': '#3f3f46',
      'editorCursor.foreground': '#a3e635',
      'editor.selectionBackground': '#84cc1633',
    },
  })
}

export function MonacoCodeEditor({ value, onChange, language, height = 320 }: MonacoCodeEditorProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10" dir="ltr">
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-black/40 px-4 py-2">
        <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">
          {monacoLanguage(language)}
        </span>
        <span className="font-mono text-[11px] text-zinc-600">{value.length} chars</span>
      </div>
      <Editor
        height={height}
        language={monacoLanguage(language)}
        value={value}
        theme="trawin-dark"
        beforeMount={defineTheme}
        onChange={(v) => onChange(v ?? '')}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          lineHeight: 24,
          fontFamily:
            "'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, monospace",
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          padding: { top: 12, bottom: 12 },
          automaticLayout: true,
          tabSize: 2,
          renderLineHighlight: 'gutter',
          scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          // IntelliSense — explicit so language services always engage.
          quickSuggestions: { other: true, comments: false, strings: true },
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: 'on',
          tabCompletion: 'on',
          wordBasedSuggestions: 'currentDocument',
          snippetSuggestions: 'inline',
          suggestSelection: 'first',
        }}
        loading={
          <div className="flex h-full items-center justify-center bg-black/40">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-signal-500 border-t-transparent" />
          </div>
        }
      />
    </div>
  )
}
