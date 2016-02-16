const transformProperties = ['Webkit', 'Moz', 'MS', 'O', '']
  .map((prefix) => `${prefix}Transform`);

const transformHA = 'translateZ(0)';

export default function enableHA(stylesTransition) {
  return Object.assign({}, stylesTransition, transformProperties.reduce(
    (nextStylesTransition, property) => {
      if(stylesTransition.hasOwnProperty(property)) {
        const [from, to] = stylesTransition;
        nextStylesTransition[property] = [`${transformHA} ${from}`, `${transformHA} ${to}`];
        return nextStylesTransition;
      }
      nextStylesTransition[property] = [transformHA, transformHA];
      return nextStylesTransition;
    },
    {},
  ));
}
