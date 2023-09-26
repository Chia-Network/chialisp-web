import { useColorMode } from '@docusaurus/theme-common';
import { Program } from 'clvm-lib';
import Highlight, { Prism } from 'prism-react-renderer';
import React, {
  Children,
  PropsWithChildren,
  ReactElement,
  ReactNode,
  isValidElement,
  useMemo,
  useState,
} from 'react';
import { FaCheck, FaKeyboard, FaPlay, FaTimes } from 'react-icons/fa';
import Editor from 'react-simple-code-editor';
import darkTheme from '../theme/prism-dark-theme-chialisp';
import lightTheme from '../theme/prism-light-theme-chialisp';

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
              <Highlight
                Prism={Prism}
                theme={(colorMode === 'dark' ? darkTheme : lightTheme) as any}
                code={currentInput}
                language={'chialisp' as any}
              >
                {({ tokens, getLineProps, getTokenProps }) => (
                  <Editor
                    value={currentInput}
                    onValueChange={(currentInput) =>
                      setCurrentInput(currentInput)
                    }
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
                )}
              </Highlight>
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
            onClick={() => {
              let program: Program;
              try {
                program = Program.fromSource(code);
              } catch (error) {
                setCurrentOutput(
                  `Parsing error: ${('' + error).replace('Error: ', '')}`
                );
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
                setCurrentOutput(
                  `Eval error: ${('' + error).replace('Error: ', '')}`
                );
                return;
              }

              setCurrentOutput(output.toSource());
            }}
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

export const childToString = (child?: ReactNode): string => {
  if (
    typeof child === 'undefined' ||
    child === null ||
    typeof child === 'boolean'
  ) {
    return '';
  }

  if (JSON.stringify(child) === '{}') {
    return '';
  }

  return (child as number | string).toString();
};

const hasChildren = (
  element: ReactNode
): element is ReactElement<{ children: ReactNode | ReactNode[] }> =>
  isValidElement<{ children?: ReactNode[] }>(element) &&
  Boolean(element.props.children);

const onlyText = (children: ReactNode | ReactNode[]): string => {
  if (!(children instanceof Array) && !isValidElement(children)) {
    return childToString(children);
  }

  return Children.toArray(children).reduce(
    (text: string, child: ReactNode): string => {
      let newText = '';

      if (isValidElement(child) && hasChildren(child)) {
        newText = onlyText(child.props.children);
      } else if (isValidElement(child) && !hasChildren(child)) {
        newText = '';
      } else {
        newText = childToString(child);
      }

      return text.concat(newText);
    },
    ''
  );
};
