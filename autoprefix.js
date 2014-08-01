var autoprefixer = require("autoprefixer");

var css = "{ transition: transform 1s }";
var p = autoprefixer.process(css);
console.warn(p.css);
