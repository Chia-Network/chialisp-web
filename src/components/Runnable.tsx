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

export interface RunnableProps {
  flavor?: 'clvm' | 'chialisp';
  input?: string;
  output?: string;
}

export default function Runnable({
  children,
  flavor,
  input,
  output,
}: PropsWithChildren<RunnableProps>) {
  const { colorMode } = useColorMode();

  const initialValue = useMemo(() => onlyText(children), []);

  const [currentInput, setCurrentInput] = useState(input?.trim() ?? '');
  const [currentOutput, setCurrentOutput] = useState<string | null>(null);
  const [code, setCode] = useState(initialValue.trim());

  const run = () => {
    let program: Program;
    try {
      program = Program.fromSource(code);
    } catch (error) {
      setCurrentOutput(`Parsing error: ${('' + error).replace('Error: ', '')}`);
      return;
    }

    let compiled: Program;

    if (!flavor || flavor === 'chialisp') {
      try {
        compiled = program.compile().value;
      } catch (error) {
        setCurrentOutput(
          `Compilation error: ${('' + error).replace('Error: ', '')}`
        );
        return;
      }

      if (compiled.isAtom) {
        setCurrentOutput(compiled.toSource());
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
      setCurrentOutput(`Eval error: ${('' + error).replace('Error: ', '')}`);
      return;
    }

    setCurrentOutput(output.toSource());
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
          {currentOutput === null ? (
            ''
          ) : (
            <>
              <hr style={{ marginTop: '14px', marginBottom: '14px' }} />
              <div style={{ display: 'inline-block' }}>
                <Highlight
                  Prism={Prism}
                  theme={(colorMode === 'dark' ? darkTheme : lightTheme) as any}
                  code={currentOutput}
                  language={'chialisp' as any}
                >
                  {({ tokens, getLineProps, getTokenProps }) =>
                    tokens.map((line, i) => (
                      <div key={i} {...getLineProps({ line })}>
                        {line.map((token, key) => (
                          <span key={key} {...getTokenProps({ token })} />
                        ))}
                      </div>
                    ))
                  }
                </Highlight>
              </div>
              {output !== undefined && (
                <>
                  <div
                    style={{
                      display: 'inline-block',
                      position: 'absolute',
                      right: '60px',
                    }}
                  >
                    <Highlight
                      Prism={Prism}
                      theme={
                        (colorMode === 'dark' ? darkTheme : lightTheme) as any
                      }
                      code={output}
                      language={'chialisp' as any}
                    >
                      {({ tokens, getLineProps, getTokenProps }) =>
                        tokens.map((line, i) => (
                          <div key={i} {...getLineProps({ line })}>
                            {line.map((token, key) => (
                              <span key={key} {...getTokenProps({ token })} />
                            ))}
                          </div>
                        ))
                      }
                    </Highlight>
                  </div>
                  {currentOutput === output ? (
                    <FaCheck
                      size={24}
                      style={{
                        color: '#77FF77',
                        position: 'absolute',
                        bottom: '16px',
                        right: '16px',
                      }}
                    />
                  ) : (
                    <FaTimes
                      size={24}
                      style={{
                        color: '#FF7777',
                        position: 'absolute',
                        bottom: '16px',
                        right: '16px',
                      }}
                    />
                  )}{' '}
                </>
              )}
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
