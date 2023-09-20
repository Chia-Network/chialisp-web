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
import { FaPlay } from 'react-icons/fa';
import Editor from 'react-simple-code-editor';
import darkTheme from '../theme/prism-dark-theme-chialisp';
import lightTheme from '../theme/prism-light-theme-chialisp';

export default function Runnable({
  children,
  flavor,
  input,
}: PropsWithChildren<{ flavor?: 'clvm' | 'chialisp'; input?: Program }>) {
  const { colorMode } = useColorMode();

  const initialValue = useMemo(() => onlyText(children), []);
  const [code, setCode] = useState(initialValue.trim());

  const [output, setOutput] = useState<string | null>(null);

  return (
    <Highlight
      Prism={Prism}
      theme={(colorMode === 'dark' ? darkTheme : lightTheme) as any}
      code={code}
      language={'chialisp' as any}
    >
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre className={className} style={{ ...style, position: 'relative' }}>
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
          <FaPlay
            size={24}
            className="play-button"
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
                setOutput(
                  `Parsing error: ${('' + error).replace('Error: ', '')}`
                );
                return;
              }

              let compiled: Program;

              if (!flavor || flavor === 'chialisp') {
                try {
                  compiled = program.compile().value;
                } catch (error) {
                  setOutput(
                    `Compilation error: ${('' + error).replace('Error: ', '')}`
                  );
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
                output = compiled.run(input ?? Program.nil).value;
              } catch (error) {
                setOutput(`Eval error: ${('' + error).replace('Error: ', '')}`);
                return;
              }

              setOutput(output.toSource());
            }}
          />
          {output === null ? (
            ''
          ) : (
            <>
              <hr />
              <Highlight
                Prism={Prism}
                theme={(colorMode === 'dark' ? darkTheme : lightTheme) as any}
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
