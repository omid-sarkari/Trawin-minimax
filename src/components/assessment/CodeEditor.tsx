'use client'

/**
 * Dependency-free code editor: monospace textarea + line numbers + Tab
 * insertion. Business logic stays server-side; this is display-only UX.
 */

import { useMemo, useRef } from 'react'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language?: string | null
  minLines?: number
  readOnly?: boolean
}

export function CodeEditor({ value, onChange, language, minLines = 10, readOnly }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const gutterRef = useRef<HTMLDivElement>(null)

  const lineCount = Math.max(minLines, value.split('\n').length)
  const lineNumbers = useMemo(
    () => Array.from({ length: lineCount }, (_, i) => i + 1),
    [lineCount],
  )

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Tab' || readOnly) return
    event.preventDefault()
    const el = event.currentTarget
    const start = el.selectionStart
    const end = el.selectionEnd
    const next = `${value.slice(0, start)}  ${value.slice(end)}`
    onChange(next)
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = start + 2
    })
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40" dir="ltr">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2">
        <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">
          {language ?? 'code'}
        </span>
        <span className="font-mono text-[11px] text-zinc-600">{value.length} chars</span>
      </div>
      <div className="flex max-h-[420px] overflow-auto">
        <div
          ref={gutterRef}
          aria-hidden
          className="select-none border-r border-white/[0.06] bg-black/30 px-3 py-3 text-right font-mono text-[13px] leading-6 text-zinc-600"
        >
          {lineNumbers.map((n) => (
            <div key={n}>{n}</div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          value={value}
          readOnly={readOnly}
          spellCheck={false}
          onScroll={(e) => {
            if (gutterRef.current) gutterRef.current.scrollTop = e.currentTarget.scrollTop
          }}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-[240px] w-full resize-none bg-transparent px-4 py-3 font-mono text-[13px] leading-6 text-zinc-100 outline-none placeholder:text-zinc-700"
          placeholder="// کد خود را اینجا بنویسید…"
        />
      </div>
    </div>
  )
}
