module hd {

  import u = hd.utility;
  import m = hd.model;

  // shortcuts for arrays
  export function arrayOf( elementType: u.Constructor|m.ComponentSpec ) {
    return m.ArrayComponent.bind( null, elementType );
  }

  export var array = m.ArrayComponent;

  // Exports
  export var Variable = m.Variable;
  export var Constraint = m.Constraint;
  export var Method = m.Method;
  export var Component = m.Component;
  export var ArrayComponent = m.ArrayComponent;
  export var MaxOptional = m.Optional.Max;
  export var MinOptional = m.Optional.Min;
  export var ComponentBuilder = m.ComponentBuilder;

}
