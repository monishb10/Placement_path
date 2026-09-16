'use client';

import {useEffect, useId, useRef} from 'react';
import {basicSetup} from 'codemirror';
import {Compartment, EditorState, Prec} from '@codemirror/state';
import {EditorView, keymap, tooltips} from '@codemirror/view';
import {indentWithTab} from '@codemirror/commands';
import {HighlightStyle, indentUnit, syntaxHighlighting} from '@codemirror/language';
import {autocompletion, acceptCompletion, closeCompletion} from '@codemirror/autocomplete';
import {java} from '@codemirror/lang-java';
import {sql, SQLite} from '@codemirror/lang-sql';
import {tags} from '@lezer/highlight';
import {toast} from 'sonner';
import {javaCompletions} from '@/lib/java-completions';

type Props = {
  value: string;
  language: 'java' | 'sql';
  disabled: boolean;
  onChange: (value: string) => void;
  onRun: () => void;
};
const maxLength = 20000;
const editorTheme = EditorView.theme({
  '&': {height: '100%', color: '#e7efff', backgroundColor: '#111f35', fontSize: '16px'},
  '&.cm-focused': {outline: 'none'},
  '.cm-scroller': {fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', lineHeight: '1.6', overflow: 'auto'},
  '.cm-content': {padding: '14px 0 28px', caretColor: '#9bd4ff'},
  '.cm-line': {padding: '0 16px 0 10px'},
  '.cm-gutters': {backgroundColor: '#14243b', color: '#91a9cb', border: 'none'},
  '.cm-lineNumbers .cm-gutterElement': {minWidth: '40px', padding: '0 10px 0 5px'},
  '.cm-activeLine, .cm-activeLineGutter': {backgroundColor: '#203451'},
  '.cm-cursor, .cm-dropCursor': {borderLeftColor: '#9bd4ff'},
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {backgroundColor: '#385780'},
  '.cm-matchingBracket': {backgroundColor: '#345277', outline: '1px solid #83b9e9'},
  '.cm-panels': {backgroundColor: '#172944', color: '#e7efff'},
  '.cm-searchMatch': {backgroundColor: '#665b30'},
  '.cm-searchMatch.cm-searchMatch-selected': {backgroundColor: '#856526'},
}, {dark: true});
const colors = HighlightStyle.define([
  {tag: tags.keyword, color: '#c8a6ff'},
  {tag: [tags.name, tags.variableName], color: '#e7efff'},
  {tag: [tags.typeName, tags.className], color: '#7fe0d7'},
  {tag: tags.function(tags.variableName), color: '#8ecbff'},
  {tag: [tags.string, tags.character], color: '#a6dfaa'},
  {tag: [tags.number, tags.bool, tags.null], color: '#ffca91'},
  {tag: tags.comment, color: '#9eafc9', fontStyle: 'italic'},
  {tag: [tags.operator, tags.punctuation], color: '#c6d7ef'},
]);

export function CodeEditor({value, language, disabled, onChange, onRun}: Props) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const readonly = useRef(new Compartment());
  const syncing = useRef(false);
  const current = useRef({value, disabled, onChange, onRun});
  current.current = {value, disabled, onChange, onRun};
  const helpId = useId();

  useEffect(() => {
    if (!host.current) return;
    const editor = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: current.current.value,
        extensions: [
          Prec.highest(keymap.of([
            {key: 'Mod-Enter', run: editor => {closeCompletion(editor); current.current.onRun(); return true;}},
            {key: 'Tab', run: acceptCompletion},
            indentWithTab,
          ])),
          basicSetup,
          language === 'java' ? java() : sql({dialect: SQLite}),
          indentUnit.of('    '),
          editorTheme,
          syntaxHighlighting(colors),
          autocompletion({
            ...(language === 'java' ? {override: [javaCompletions]} : {}),
            activateOnTyping: true,
            activateOnTypingDelay: 120,
            maxRenderedOptions: 8,
            tooltipClass: () => 'practice-code-completions',
          }),
          // Keep suggestions above the resizable, independently scrolling panels.
          tooltips({parent: document.body}),
          readonly.current.of([
            EditorState.readOnly.of(current.current.disabled),
            EditorView.editable.of(!current.current.disabled),
          ]),
          EditorView.contentAttributes.of({
            'aria-label': `${language === 'java' ? 'Java' : 'SQL'} source code`,
            'aria-describedby': helpId,
            spellcheck: 'false', autocapitalize: 'off', autocorrect: 'off',
          }),
          EditorState.transactionFilter.of(transaction => {
            if (transaction.docChanged && transaction.newDoc.length > maxLength && !syncing.current) {
              toast.message('Keep your code within 20,000 characters.', {id: 'code-length-limit'});
              return [];
            }
            return transaction;
          }),
          EditorView.updateListener.of(update => {
            if (update.docChanged && !syncing.current) current.current.onChange(update.state.doc.toString());
          }),
        ],
      }),
    });
    view.current = editor;
    return () => {view.current = null; editor.destroy();};
  }, [language, helpId]);

  useEffect(() => {
    const editor = view.current;
    if (!editor || editor.state.doc.toString() === value) return;
    syncing.current = true;
    try {editor.dispatch({changes: {from: 0, to: editor.state.doc.length, insert: value}});}
    finally {syncing.current = false;}
  }, [value]);

  useEffect(() => {
    const editor = view.current;
    if (!editor) return;
    editor.dispatch({effects: readonly.current.reconfigure([
      EditorState.readOnly.of(disabled), EditorView.editable.of(!disabled),
    ])});
    if (disabled) closeCompletion(editor);
  }, [disabled]);

  return <div className="practice-code-editor" data-readonly={disabled}>
    <div ref={host} className="code-editor-surface"/>
    <div className="code-editor-help"><span><kbd>Ctrl Space</kbd> suggestions · <kbd>Tab</kbd> accept / indent</span><span>{value.length.toLocaleString('en-US')} / 20,000</span></div>
    <span id={helpId} className="sr-only">Suggestions appear as you type. Use the arrow keys to select a suggestion and Enter or Tab to insert it. Press Escape to dismiss suggestions. Press Escape, then Tab to leave the editor. Control or Command Enter runs samples.</span>
  </div>;
}
