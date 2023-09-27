---
id: quiz
title: Quiz Example
slug: /quiz
---

import Runnable from '../src/components/Runnable.tsx';
import Quiz from '../src/components/Quiz.tsx';

This is an example quiz. Answer the following questions and see your score at the end.

<Quiz>

<Runnable flavor='chialisp'>

```chialisp
(mod ()
    (defun square (number)
        (* number number)
    )

    (square 5)
)
```

</Runnable>

</Quiz>
