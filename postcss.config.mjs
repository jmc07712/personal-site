/**
 * Stylesheets are written in px at laptop size. postcss-pxtorem turns every px into rem at build
 * time, and src/app/scale.css sets the rem to 16px × --ui, so the whole interface grows in steps
 * on big screens (docs/design.md §13a). Media queries stay in px, and so does scale.css, since it
 * defines the rem. A custom config replaces Next's defaults, which only matter to old browsers.
 */
const config = {
  plugins: {
    'postcss-pxtorem': {
      propList: ['*'],
      exclude: /scale\.css$/,
    },
  },
};

export default config;
