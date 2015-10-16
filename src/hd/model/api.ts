module hd {

  import u = hd.utility;
  import m = hd.model;

  // shortcuts for arrays
  export function arrayOf( elementType: u.Constructor|m.ContextSpec ) {
    return m.ArrayContext.bind( null, elementType );
  }

  export var array = m.ArrayContext;

  // Exports
  export var Variable = m.Variable;
  export var Constraint = m.Constraint;
  export var Method = m.Method;
  export var Context = m.Context;
  export var ArrayContext = m.ArrayContext;
  export var MaxOptional = m.Optional.Max;
  export var MinOptional = m.Optional.Min;
  export var ContextBuilder = m.ContextBuilder;

}
