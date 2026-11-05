// Original: https://github.com/dracula/visual-studio-code
// Converted automatically using ./tools/themeFromVsCode
var theme = {
  plain: {
    color: "#122957",
    backgroundColor: "#eef0f5",
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
      color: "#122957"
    }
  }, {
    types: ["variable"],
    style: {
      fontStyle: "italic"
    }
  }, {
    types: ["comment"],
    style: {
      color: "#656d7b",
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