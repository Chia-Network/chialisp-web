// Original: https://github.com/dracula/visual-studio-code
// Converted automatically using ./tools/themeFromVsCode
var theme = {
  plain: {
    color: "#F8F8F2",
    backgroundColor: "#282A36",
    fontWeight: "bold",
  },
  styles: [{
    types: ["keyword"],
    style: {
      color: "rgb(189, 147, 249)"
    }
  }, {
    types: ["listop","class-name","quotes"],
    style: {
      color: "rgb(80, 250, 123)"
    }
  }, {
    types: ["builtin"],
    style: {
      color: "rgb(5, 227, 223)"
    }
  }, {
    types: ["number","hexadecimal","string","boolean"], //numbers and hexes must be the same color
    style: {
      color: "rgb(255, 184, 108)",
      fontWeight: "normal",
    }
  }, {
    types: ["punctuation", "symbol"],
    style: {
      color: "rgb(248, 248, 242)"
    }
  }, {
    types: ["variable"],
    style: {
      fontStyle: "italic"
    }
  }, {
    types: ["comment"],
    style: {
      color: "rgb(98, 114, 164)",
      fontWeight: "normal",
    }
  }, {
    types: ["function","car"],
    style: {
      color: "rgb(241, 250, 140)"
    }
  }]
};

module.exports = theme;
