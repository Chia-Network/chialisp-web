---
id: quiz
title: Quiz Example
slug: /quiz
---

import Runnable from '../src/components/Runnable.tsx';
import Quiz from '../src/components/Quiz.tsx';

This is an example quiz. Answer the following questions and see your score at the end.

<Quiz content={(register) => <>

Give a value for a and b that adds to 25:

<Runnable flavor='chialisp' output='25' reporter={register()}>

```chialisp
(+ a b)
```

</Runnable>

Now fill in a, b, and c such that the answer is 70:

<Runnable flavor='chialisp' output='70' reporter={register()}>

```chialisp
(* a (+ b c))
```

</Runnable>

Enter a value for a such that the output of this is 25:

<Runnable flavor='chialisp' output='25' reporter={register()}>

```chialisp
(mod ()
    (defun square (number)
        (* number number)
    )

    (square a)
)
```

</Runnable>
</>} />
