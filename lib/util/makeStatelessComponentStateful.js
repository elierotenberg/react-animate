import React from 'react';

export default function makeStatelessComponentStateful(type) {
  return class extends React.Component {
    static displayName = type.name;
    render() {
      return type(this.props, this.context);
    }
  };
}
