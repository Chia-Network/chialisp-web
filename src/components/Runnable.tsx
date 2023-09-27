import { useColorMode } from '@docusaurus/theme-common';
import { Program } from 'clvm-lib';
import Highlight, { Prism } from 'prism-react-renderer';
import React, { PropsWithChildren, useMemo, useState } from 'react';
import { FaKeyboard, FaPlay } from 'react-icons/fa';
import Editor from 'react-simple-code-editor';
import darkTheme from '../theme/prism-dark-theme-chialisp';
import lightTheme from '../theme/prism-light-theme-chialisp';
import { onlyText } from '../utils/stringify';

export interface RunnableProps {
  flavor?: 'clvm' | 'chialisp';
  input?: string;
}

export default function Runnable({
  children,
  flavor,
  input,
}: PropsWithChildren<RunnableProps>) {
  const { colorMode } = useColorMode();

  const initialValue = useMemo(() => onlyText(children), []);

  const [currentInput, setCurrentInput] = useState(input?.trim() ?? '');
  const [code, setCode] = useState(initialValue.trim());
  const [output, setOutput] = useState<string | null>(null);

  const run = () => {
    let program: Program;
    try {
      program = Program.fromSource(code);
    } catch (error) {
      setOutput(`Parsing error: ${('' + error).replace('Error: ', '')}`);
      return;
    }

    let compiled: Program;

    if (!flavor || flavor === 'chialisp') {
      try {
        compiled = program.compile().value;
      } catch (error) {
        setOutput(`Compilation error: ${('' + error).replace('Error: ', '')}`);
        return;
      }

      if (compiled.isAtom) {
        setOutput(compiled.toSource());
        return;
      }
    } else {
      compiled = program;
    }

    let output: Program;
    try {
      output = compiled.run(
        currentInput ? Program.fromSource(currentInput) : Program.nil
      ).value;
    } catch (error) {
      setOutput(`Eval error: ${('' + error).replace('Error: ', '')}`);
      return;
    }

    setOutput(output.toSource());
  };

  return (
    <Highlight
      Prism={Prism}
      theme={(colorMode === 'dark' ? darkTheme : lightTheme) as any}
      code={code}
      language={'chialisp' as any}
    >
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre className={className} style={{ ...style, position: 'relative' }}>
          {!currentInput ? (
            ''
          ) : (
            <>
              <HighlightCode
                code={currentInput}
                setCode={setCurrentInput}
                language="chialisp"
              />
              <hr style={{ marginTop: '14px', marginBottom: '14px' }} />
            </>
          )}
          <Editor
            value={code}
            onValueChange={(code) => setCode(code)}
            highlight={() =>
              tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))
            }
            padding={0}
          />
          {!currentInput && (
            <FaKeyboard
              size={24}
              className="icon-button"
              style={{
                position: 'absolute',
                top: '16px',
                right: '60px',
                cursor: 'pointer',
              }}
              onClick={() => setCurrentInput('()')}
            />
          )}
          <FaPlay
            size={24}
            className="icon-button"
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              cursor: 'pointer',
            }}
            onClick={run}
          />
          {output === null ? (
            ''
          ) : (
            <>
              <hr style={{ marginTop: '14px', marginBottom: '14px' }} />
              <HighlightCode code={output} language="chialisp" />
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

  return (
    <Highlight
      Prism={Prism}
      theme={(colorMode === 'dark' ? darkTheme : lightTheme) as any}
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
  );
}
