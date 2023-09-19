(function (Prism) {
  // Functions to construct regular expressions
  // simple form
  // e.g. (interactive ... or (interactive)
  function simple_form(name) {
    return RegExp('(\\()' + name + '(?=[\\s\\)])');
  }
  // booleans and numbers
  function primitive(pattern) {
    return RegExp('([\\s([])' + pattern + '(?=[\\s)])');
  }

  // Patterns in regular expressions

  // Symbol name. See https://www.gnu.org/software/emacs/manual/html_node/elisp/Symbol-Type.html
  // & and : are excluded as they are usually used for special purposes
  var symbol = '[-+*/_~!@$%^=<>{}\\w]+';
  // symbol starting with & used in function arguments
  var marker = '&' + symbol;
  // Open parenthesis for look-behind
  var par = '(\\()';
  var endpar = '(?=\\))';
  // End the pattern with look-ahead space
  var space = '(?=\\s)';

  var language = {
    comment: /;.*/,
    string: {
      pattern: /"(?:[^"\\]|\\.)*"/,
      greedy: true,
      inside: {
        argument: /[-A-Z]+(?=[.,\s])/,
        symbol: RegExp('`' + symbol + "'"),
      },
    },
    keyword: [
      {
        pattern: RegExp(
          par +
            '(?:(?:lexical-)?let\\*?|(?:cl-)?if|defconstant|i|include)' +
            space
        ),
        lookbehind: true,
      },
      {
        pattern: RegExp(
          par +
            '(?:sha256|x|a|=|concat|\\+|\\-|\\/|\\*|logand|logior|logxor|lognot|ash|lsh|substr|strlen|sha256|point_add|pubkey_for_exp)(?=\\s+|\\))'
        ),
        lookbehind: true,
        alias: 'builtin',
      },
      {
        pattern: RegExp(par + '(?:q[q]*|unquote)(?=\\s+|\\))'),
        lookbehind: true,
        alias: 'quotes',
      },
      {
        pattern: RegExp(par + '(?:f|r|list|c|l)' + space),
        lookbehind: true,
        alias: 'listop',
      },
    ],
    boolean: {
      pattern: primitive('\\(\\)'),
      lookbehind: true,
    },
    hexadecimal: {
      pattern: /0x[0-9a-fA-F]+/,
    },
    number: {
      pattern: RegExp('([\\s([])' + '[-+]?\\d+(?:\\.\\d*)?'),
      lookbehind: true,
    },
    brun: /(\$ )*(brun|run|opd|opc)/,
    defun: {
      pattern: RegExp(
        par +
          '(?:cl-)?(?:defun\\*?|defmacro|defun-inline)\\s+' +
          symbol +
          '\\s+\\([\\s\\S]*?\\)'
      ),
      lookbehind: true,
      inside: {
        keyword: /^(?:cl-)?def\S+/,
        // identifier: RegExp(symbol),
        // See below, this property needs to be defined later so that it can
        // reference the language object.
        arguments: null,
        function: {
          pattern: RegExp('(^\\s)' + symbol),
          lookbehind: true,
        },
        punctuation: /[()]/,
      },
    },
    mod: {
      pattern: RegExp(par + '(?:cl-)?(?:mod)' + '\\s+\\([\\s\\S]*?\\)'),
      lookbehind: true,
      inside: {
        keyword: /^mod/,
        // See below, this property needs to be defined later so that it can
        // reference the language object.
        arguments: null,
        function: {
          pattern: RegExp('(^\\s)'),
          lookbehind: true,
        },
        punctuation: /[()]/,
      },
    },
    car: {
      pattern: RegExp(par + symbol + space),
      lookbehind: true,
    },
    punctuation: [
      // open paren, brackets, and close paren
      /(?:['`,]?\(|[)\[\]])/,
      // cons
      {
        pattern: /(\s)\.(?=\s)/,
        lookbehind: true,
      },
    ],
  };

  var arg = {
    'lisp-marker': RegExp(marker),
    rest: {
      argument: {
        pattern: RegExp(symbol),
        alias: 'variable',
      },
      varform: {
        pattern: RegExp(par + symbol + '\\s+\\S[\\s\\S]*' + endpar),
        lookbehind: true,
        inside: {
          string: language.string,
          boolean: language.boolean,
          number: language.number,
          symbol: language.symbol,
          punctuation: /[()]/,
        },
      },
    },
  };

  var forms = '\\S+(?:\\s+\\S+)*';

  var arglist = {
    pattern: RegExp(par + '[\\s\\S]*' + endpar),
    lookbehind: true,
    inside: {
      'rest-vars': {
        pattern: RegExp('&(?:rest|body)\\s+' + forms),
        inside: arg,
      },
      'other-marker-vars': {
        pattern: RegExp('&(?:optional|aux)\\s+' + forms),
        inside: arg,
      },
      keys: {
        pattern: RegExp('&key\\s+' + forms + '(?:\\s+&allow-other-keys)?'),
        inside: arg,
      },
      argument: {
        pattern: RegExp(symbol),
        alias: 'variable',
      },
      punctuation: /[()]/,
    },
  };

  language['defun'].inside.arguments = Prism.util.clone(arglist);
  language['defun'].inside.arguments.inside.sublist = Prism.util.clone(arglist);
  language['mod'].inside.arguments = Prism.util.clone(arglist);
  language['mod'].inside.arguments.inside.sublist = Prism.util.clone(arglist);

  Prism.languages.chialisp = language;
})(Prism);
