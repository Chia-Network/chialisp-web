import React, { ReactNode, useMemo, useReducer } from 'react';

export type CorrectReporter = React.Dispatch<React.SetStateAction<boolean>>;

export interface QuizProps {
  content: (newReporter: () => CorrectReporter) => ReactNode;
}

export default function Quiz({ content }: QuizProps) {
  const [_, forceUpdate] = useReducer((x) => x + 1, 0);
  const states = useMemo<Array<boolean | null>>(() => [], [content]);
  const resolved = useMemo(() => {
    let i = 0;
    return content(() => {
      const pos = i++;
      if (pos >= states.length) states.push(null);
      return (value) => {
        const result =
          typeof value === 'boolean' ? value : value(states[pos] ?? false);
        states[pos] = result;
        forceUpdate();
      };
    });
  }, [content]);

  const isComplete = states.findIndex((state) => state === null) === -1;
  const score = Math.floor(
    (states.filter((value) => value === true).length / states.length) * 100
  );

  return (
    <>
      {resolved}
      <br />
      {!isComplete ? 'Incomplete' : `Score: ${score}%`}
    </>
  );
}
