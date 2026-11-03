import { useColorMode } from '@docusaurus/theme-common';
import { Program, ProgramOutput } from 'clvm-lib';
import { Highlight } from 'prism-react-renderer';
import React, { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { FaCheck, FaKeyboard, FaPlay, FaTimes } from 'react-icons/fa';
import Editor from 'react-simple-code-editor';
import darkTheme from '../theme/prism-dark-theme-chialisp';
import lightTheme from '../theme/prism-light-theme-chialisp';
import { onlyText } from '../utils/stringify';

export interface RunnableProps {
  flavor?: 'clvm' | 'chialisp';
  input?: string;
  tests?: Record<string, string>;
  reporter?: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Runnable({
  children,
  flavor,
  input: initialInput,
  tests,
  reporter,
}: PropsWithChildren<RunnableProps>) {
  const { colorMode } = useColorMode();

  const initialCode = useMemo(() => onlyText(children).trim(), []);
  const [code, setCode] = useState(initialCode);

  const [input, setInput] = useState(
    initialInput ?? Object.keys(tests ?? {})[0]?.trim() ?? ''
  );
  const [output, setOutput] = useState('');
  const [cost, setCost] = useState(0n);
  const [correct, setCorrect] = useState<boolean | null>(null);

  const formatError = (error: string) => error.replace('Error: ', '');

  const parse = (): Program | null => {
    try {
      return Program.fromSource(code);
    } catch (error) {
      setOutput(`While parsing: ${formatError('' + error)}`);
      return null;
    }
  };

  const compile = (program: Program): Program | null => {
    if (!flavor || flavor === 'chialisp') {
      try {
        return program.compile().value;
      } catch (error) {
        setOutput(`While compiling: ${formatError('' + error)}`);
        return null;
      }
    } else {
      return program;
    }
  };

  const evaluate = (program: Program, env: Program): ProgramOutput | null => {
    try {
      return program.run(env);
    } catch (error) {
      setOutput(`While evaluating: ${formatError('' + error)}`);
      return null;
    }
  };

  const run = () => {
    const parsed = parse();
    if (!parsed) return;

    const shouldEval =
      flavor === 'clvm' ||
      (parsed.isCons && parsed.first.equals(Program.fromText('mod')));

    const compiled = compile(parsed);
    if (!compiled) return;

    const inputProgram = input ? Program.fromSource(input) : Program.nil;
    const outputProgram = shouldEval
      ? evaluate(compiled, inputProgram)
      : { value: compiled, cost: 0n };
    if (outputProgram) {
      setOutput(outputProgram.value.toSource());
      setCost(outputProgram.cost);
    }

    let isCorrect = true;

    for (const [testedInput, expectedOutput] of Object.entries(tests ?? {})) {
      const inputProgram = Program.fromSource(testedInput);
      const outputProgram = shouldEval
        ? evaluate(compiled, inputProgram)?.value
        : compiled;

      if (!outputProgram || outputProgram.toSource() !== expectedOutput) {
        isCorrect = false;
        break;
      }
    }

    reporter?.(isCorrect);
    setCorrect(isCorrect);
  };

  const CorrectIcon = correct ? FaCheck : FaTimes;

  // Prevent SSR
  const [hydrated, setHydrated] = React.useState(false);
  useEffect(() => setHydrated(true), []);

  return (
    <Highlight
      Prism={globalThis.Prism}
      theme={
        hydrated && ((colorMode === 'dark' ? darkTheme : lightTheme) as any)
      }
      code={code}
      language={'chialisp' as any}
    >
      {({ className, style }) => (
        <pre
          className={`${className} runnable`}
          style={{ ...style, position: 'relative' }}
        >
          {!input ? (
            ''
          ) : (
            <>
              <HighlightCode
                code={input}
                setCode={setInput}
                language="chialisp"
              />
              <hr className="runnable__divider" />
            </>
          )}
          <HighlightCode code={code} setCode={setCode} language="chialisp" />
          <div className="runnable__controls">
            <span className="runnable__flavor">
              {!flavor || flavor === 'chialisp' ? 'Chialisp' : 'CLVM'}
            </span>
            {!input && (
              <button
                type="button"
                className="icon-button icon-button--secondary"
                aria-label="Add input"
                title="Add input"
                onClick={() => setInput('()')}
              >
                <FaKeyboard size={16} />
              </button>
            )}
            <button
              type="button"
              className="icon-button"
              aria-label="Run"
              title="Run"
              onClick={run}
            >
              <FaPlay size={14} />
            </button>
          </div>
          {!output ? (
            ''
          ) : (
            <>
              <hr className="runnable__divider" />
              <div className="runnable__output">
                <div className="runnable__value">
                  <HighlightCode code={output} language="chialisp" />
                </div>
                <div className="runnable__cost">
                  <HighlightCode code={`Cost: ${cost}`} language="chialisp" />
                </div>
                <CorrectIcon
                  size={24}
                  aria-label={correct ? 'Correct' : 'Incorrect'}
                  className={`runnable__result ${
                    correct
                      ? 'runnable__result--correct'
                      : 'runnable__result--incorrect'
                  }`}
                />
              </div>
            </>
          )}
        </pre>
      )}
    </Highlight>
  );
}

interface HighlightCodeProps {
  code: string;
  setCode?: React.Dispatch<React.SetStateAction<string>>;
  language: string;
}

function HighlightCode({ code, setCode, language }: HighlightCodeProps) {
  const { colorMode } = useColorMode();

  // Prevent SSR
  const [hydrated, setHydrated] = React.useState(false);
  useEffect(() => setHydrated(true), []);

  return (
    <>
      <Highlight
        Prism={globalThis.Prism}
        theme={
          hydrated && ((colorMode === 'dark' ? darkTheme : lightTheme) as any)
        }
        code={code}
        language={language as any}
      >
        {({ tokens, getLineProps, getTokenProps }) => {
          let children = tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token })} />
              ))}
            </div>
          ));

          return setCode ? (
            <Editor
              value={code}
              onValueChange={(newCode) => setCode(newCode)}
              highlight={() => children}
              padding={0}
            />
          ) : (
            children
          );
        }}
      </Highlight>
    </>
  );
}
