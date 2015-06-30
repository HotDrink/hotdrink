
module hd {

  import u = hd.utility;
  import r = hd.reactive;
  import p = hd.plan;
  import m = hd.model;
  import s = hd.system;
  import b = hd.bindings;

  /*==================================================================
   * Enablement functions
   */

  export function markUsed( p: r.Promise<any> ) {
    p.usage.set( r.Usage.Used );
  }

  export function markUnused( p: r.Promise<any> ) {
    p.usage.set( r.Usage.Unused );
  }

  export function markDelayed( p: r.Promise<any> ) {
    p.usage.set( r.Usage.Delayed );
  }

  /*==================================================================
   * Export
   */

  export var dateCompare = u.dateCompare;
  export var ProxyObserver = r.ProxyObserver;
  export var BasicObservable = r.BasicObservable;
  export var Promise = r.Promise;
  export var Extension = r.Extension;
  export var liftFunction = r.liftFunction;

  export var dir = b.Direction;
  export var bind = b.bind;
  export var unbind = b.unbind;
  export var performDeclaredBindings = b.performDeclaredBindings;
  export var isObservable = b.isObservable;
  export var isObserver = b.isObserver;
  export var isExtension = b.isExtension;

  export var Context = m.Context;

  // RunTime
  export var PropertyModel = s.PropertyModel;
  export var ContextBuilder = m.ContextBuilder;

  // Bindings
  export var Checked = b.Checked;
  export var Clicked = b.Clicked;
  export var CssClass = b.CssClass;
  export var Edit = b.Edit;
  export var Enabled = b.Enabled;
  export var MousePosition = b.MousePosition;
  export var Position = b.Position;
  export var Text = b.Text;
  export var Time = b.Time;
  export var Value = b.Value;

  // Factories
  export var checked = b.checked;
  export var clicked = b.clicked;
  export var cssClass = b.cssClass;
  export var edit = b.edit;
  export var editVar = b.editVar;
  export var date = b.date;
  export var dateVar = b.dateVar;
  export var enabled = b.enabled;
  export var mousePosition = b.getMousePosition;
  export var num = b.num;
  export var numVar = b.numVar;
  export var position = b.position;
  export var text = b.text;
  export var value = b.value;

  // Extensions
  export var chain = b.chain;
  export var dateToMilliseconds = b.dateToMilliseconds;
  export var dateToDateString = b.dateToDateString;
  export var dateToString = b.dateToString;
  export var dateToTimeString = b.dateToTimeString;
  export var def = b.def;
  export var delay = b.delay;
  export var exp = b.exp;
  export var fix = b.fix;
  export var fn = b.fn;
  export var millisecondsToDate = b.millisecondsToDate;
  export var msg = b.msg;
  export var offset = b.offset;
  export var path = b.path;
  export var pointToString = b.pointToString;
  export var prec = b.prec;
  export var rw = b.rw;
  export var req = b.req;
  export var round = b.round;
  export var scale = b.scale;
  export var stabilize = b.stabilize;
  export var toDate = b.toDate;
  export var toJson = b.toJson;
  export var toNum = b.toNum;
  export var toStr = b.toStr;
}
