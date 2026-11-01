import { useEffect, useRef } from "react";
import { EditorView, keymap } from "@codemirror/view";
import { Prec, EditorState } from "@codemirror/state";
import { basicSetup } from "codemirror";
import {
  HighlightStyle,
  syntaxHighlighting,
  StreamLanguage,
} from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { csharp } from "@codemirror/legacy-modes/mode/clike";
import {
  snippet,
  nextSnippetField,
  prevSnippetField,
  clearSnippet,
  autocompletion,
  acceptCompletion,
} from "@codemirror/autocomplete";
import {
  indentWithTab,
  lineComment,
  lineUncomment,
  moveLineUp,
  moveLineDown,
  copyLineDown,
} from "@codemirror/commands";
import { openSearchPanel, gotoLine } from "@codemirror/search";
import { csharpCompletions } from "../lib/csharp-completion.mjs";
import { snippetAt, plainSnippet } from "../lib/editor-snippets.mjs";
import { requestQuest } from "../lib/workshop-quests.mjs";
export default function CodeEditor({
  value,
  onChange,
  plain = false,
  label = "C# code editor",
  focusTarget,
  completionContext = "",
}: {
  value: string;
  onChange: (v: string) => void;
  plain?: boolean;
  label?: string;
  focusTarget?: { name: string; request: number };
  completionContext?: string;
}) {
  const plainEditor = useRef<HTMLTextAreaElement>(null);
  const host = useRef<HTMLDivElement>(null),
    editor = useRef<EditorView | null>(null),
    callback = useRef(onChange);
  callback.current = onChange;
  // Keep CodeMirror authoritative while a user types or replaces a large draft.
  // Echoed React props must not overwrite in-flight editor input.
  const lastReported = useRef(value);
  const syncingFromProps = useRef(false);
  const extra = useRef(completionContext);
  extra.current = completionContext;
  useEffect(() => {
    if (plain || !host.current) return;
    let armed = -1,
      chord = false;
    const view = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          StreamLanguage.define(csharp),
          syntaxHighlighting(
            HighlightStyle.define([
              { tag: tags.keyword, color: "#d9b4f5" },
              { tag: tags.string, color: "#ffcfad" },
              { tag: tags.comment, color: "#abc5b6" },
              { tag: [tags.number, tags.bool], color: "#f1d37b" },
              { tag: tags.typeName, color: "#a8dfea" },
            ]),
          ),
          EditorView.lineWrapping,
          EditorView.contentAttributes.of({
            "aria-label": label,
            spellcheck: "false",
          }),
          EditorView.updateListener.of((update) => {
            if (!update.docChanged || syncingFromProps.current) return;
            const current = update.state.doc.toString();
            lastReported.current = current;
            callback.current(current);
          }),
          Prec.highest(
            keymap.of([
              {
                key: "Tab",
                run: (v) => {
                  if (nextSnippetField(v)) return true;
                  const at = v.state.selection.main.head,
                    item = snippetAt(v.state.doc.toString(), at);
                  if (item) {
                    if (armed === at) {
                      snippet(item.template)(v, null, item.from, item.to);
                      armed = -1;
                      requestQuest("snippet-builder");
                    } else armed = at;
                    return true;
                  }
                  armed = -1;
                  if (acceptCompletion(v)) return true;
                  return indentWithTab.run!(v);
                },
              },
              { key: "Shift-Tab", run: prevSnippetField },
              {
                key: "Escape",
                run: (v) => {
                  armed = -1;
                  clearSnippet(v);
                  v.setTabFocusMode(1500);
                  return false;
                },
              },
              {
                key: "Mod-k",
                run: () => {
                  chord = true;
                  return true;
                },
              },
              {
                key: "Mod-c",
                run: (v) => {
                  if (!chord) return false;
                  chord = false;
                  requestQuest("comment-ninja");
                  return lineComment(v);
                },
              },
              {
                key: "Mod-u",
                run: (v) => {
                  if (!chord) return false;
                  chord = false;
                  return lineUncomment(v);
                },
              },
              { key: "Mod-f", run: openSearchPanel },
              { key: "Mod-h", run: openSearchPanel },
              { key: "Mod-g", run: gotoLine },
              { key: "Alt-ArrowUp", run: moveLineUp },
              { key: "Alt-ArrowDown", run: moveLineDown },
              { key: "Mod-d", run: copyLineDown },
              { key: "Mod-s", run: () => true },
            ]),
          ),
          autocompletion({
            interactionDelay: 0,
            override: [
              (context) => {
                if (
                  !context.explicit &&
                  !context.matchBefore(/(?:[A-Za-z_]\w*|\.)$/)
                )
                  return null;
                return csharpCompletions(
                  context.state.doc.toString(),
                  context.pos,
                  extra.current,
                );
              },
            ],
          }),
          EditorView.theme({
            "&": {
              height: "100%",
              background: "var(--editor-bg)",
              color: "var(--editor-fg)",
            },
            ".cm-content": {
              fontFamily: "Consolas, monospace",
              fontSize: "14px",
              padding: "18px 0",
              caretColor: "#efb934",
            },
            ".cm-gutters": {
              background: "var(--editor-bg)",
              color: "#809e91",
              borderRight: "1px solid #385246",
            },
            ".cm-scroller": { overflow: "auto" },
            ".cm-activeLine": { background: "#1e3a30" },
            ".cm-activeLineGutter": { background: "#1e3a30" },
            "&.cm-focused .cm-selectionBackground,.cm-selectionBackground": {
              background: "#36544a",
            },
          }),
        ],
      }),
    });
    editor.current = view;
    return () => {
      view.destroy();
      editor.current = null;
    };
  }, [plain, label]);
  useEffect(() => {
    // Ordinary keystrokes already updated CodeMirror and were reported upward;
    // only external changes (file switch/reset/restore) should replace the doc.
    if (value === lastReported.current) return;
    lastReported.current = value;
    const view = editor.current;
    if (view && value !== view.state.doc.toString()) {
      syncingFromProps.current = true;
      try {
        view.dispatch({
          changes: { from: 0, to: view.state.doc.length, insert: value },
        });
      } finally {
        syncingFromProps.current = false;
      }
    }
  }, [value]);
  useEffect(() => {
    if (!focusTarget) return;
    const signature = `void ${focusTarget.name}(`;
    const index = value.indexOf(signature);
    if (index < 0) return;
    const opening = value.indexOf("{", index);
    const at = opening >= 0 ? opening + 1 : index;
    const view = editor.current;
    if (view) {
      view.dispatch({
        selection: { anchor: at },
        effects: EditorView.scrollIntoView(at, { y: "center" }),
      });
      view.focus();
    } else if (plainEditor.current) {
      plainEditor.current.focus();
      plainEditor.current.setSelectionRange(at, at);
    }
    (view?.dom || plainEditor.current)?.scrollIntoView({ block: "center" });
  }, [focusTarget, plain]);
  return plain ? (
    <textarea
      ref={plainEditor}
      className="plain-editor"
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
      onKeyDown={(e) => {
        if (e.key !== "Tab" || e.shiftKey) return;
        const target = e.currentTarget,
          item = snippetAt(value, target.selectionStart);
        if (!item) return;
        e.preventDefault();
        if (target.dataset.snippet === String(target.selectionStart)) {
          const result = plainSnippet(item);
          onChange(
            value.slice(0, item.from) + result.text + value.slice(item.to),
          );
          delete target.dataset.snippet;
          requestQuest("snippet-builder");
          requestAnimationFrame(() =>
            target.setSelectionRange(
              item.from + result.selection.from,
              item.from + result.selection.to,
            ),
          );
        } else target.dataset.snippet = String(target.selectionStart);
      }}
    />
  ) : (
    <div className="code-editor-shell">
      <div className="editor-host" ref={host} />
    </div>
  );
}
