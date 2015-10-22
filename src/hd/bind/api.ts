module hd {

  import b = hd.bind;


  // Export
  export var createBindings = b.createBindings;
  export var destroyBindings = b.destroyBindings;
  export var createDeclaredBindings = b.createDeclaredBindings;
  export var Direction = b.Direction;
  export var isObservable = b.isObservable;
  export var isObserver = b.isObserver;
  export var isExtension = b.isExtension;
  export var getMousePosition = b.getMousePosition;

  // Bindings
  export var Change = b.Change;
  export var Checked = b.Checked;
  export var Click = b.Click;
  export var CssClass = b.CssClass;
  export var DblClick = b.DblClick;
  export var Edit = b.Edit;
  export var Enabled = b.Enabled;
  export var KeyDown = b.KeyDown;
  export var MouseDown = b.MouseDown;
  export var MouseUp = b.MouseUp;
  export var MousePosition = b.MousePosition;
  export var Position = b.Position;
  export var Text = b.Text;
  export var Time = b.Time;
  export var Value = b.Value;

  export var OnlyKey = b.OnlyKey;

  export
  function bindEnv( el: HTMLElement, scope: b.Scope ) {
    return new b.BindEnvironment( el, scope );
  }
}
