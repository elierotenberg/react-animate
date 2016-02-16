export default function isStatelessComponent(type) {
  return typeof type.prototype === 'undefined' || typeof type.prototype.render !== 'function';
}
