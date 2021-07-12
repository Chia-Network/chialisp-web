// Original: https://github.com/dracula/visual-studio-code
// Converted automatically using ./tools/themeFromVsCode
var theme = {
  plain: {
    color: "#383a42",
    backgroundColor: "#fafafa",
    fontWeight: "bold"
  },
  styles: [{
    types: ["keyword"],
    style: {
      color: "#990096",
    }
  }, {
    types: ["listop","class-name","quotes"],
    style: {
      color: "#006100"
    }
  }, {
    types: ["builtin"],
    style: {
      color: "#127EAF"
    }
  }, {
    types: ["number","hexadecimal","string","boolean"], //numbers and hexes must be the same color
    style: {
      color: "#B35C00",
      fontWeight: "normal",
    }
  }, {
    types: ["punctuation", "symbol"],
    style: {
      color: "#383a42"
    }
  }, {
    types: ["variable"],
    style: {
      fontStyle: "italic"
    }
  }, {
    types: ["comment"],
    style: {
      color: "#73737D",
      fontWeight: "normal",
    }
  }, {
    types: ["function","car"],
    style: {
      color: "#0045DB"
    }
  }]
};

module.exports = theme;