module.exports = {
  env: {
    test: {
      plugins: ['@babel/plugin-transform-modules-commonjs'],
    },
  },
};

/** @type {string} */
const a = 1;
console.log(a);
