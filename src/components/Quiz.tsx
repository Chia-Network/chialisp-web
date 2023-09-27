import React, { PropsWithChildren } from 'react';

export interface QuizItem {
  flavor?: 'clvm' | 'chialisp';
  input?: string;
}

export default function Quiz({ children }: PropsWithChildren<{}>) {
  return <>{children}</>;
}
