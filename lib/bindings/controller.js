(function () {

  /* All binders, both built-in and custom, go here. */
  hd.binders = {};

  /* @param view {View}
   *   The binders should know the concrete type, but for this function to be
   *   generic for both DOM elements and third-party widgets, the view must
   *   be abstract here.
   * @returns {Boolean}
   *   True if any of the binders return a truthy value. This feature is used
   *   by the default binding system to stop recursion into the descendants
   *   of a view.
   */
  var bindAny = function bindAny(view, bindings, context) {
    var doNotRecurse = false;

    /* For each binding, call the named binder. */
    Object.keys(bindings).forEach(function (binderName) {
      var binder = hd.binders[binderName];

      if (!binder) {
        ERROR("No binder for " + binderName);
        return;
      }

      if (binder(view, bindings[binderName], context)) {
        doNotRecurse = true;
      }
    }, this);

    return doNotRecurse;
  };

  /* Compilers manipulate source code consisting of "sections" (alluding to
   * assembly programming). Each `sections` variable should be an object with
   * two properties:
   *
   *   data :: String = declarations to be evaluated in the binding context
   *
   *   code :: String = binding list (like would be found in a `data-bind`
   *     attribute), to be evaluated in the binding context, that refers to
   *     the declarations in `data`
   *
   * `transform` is a function that takes the sections and an expression from
   * the `code`, might add a declaration to the `data`, and returns a
   * replacement expression.
   *
   * Expressions in the `code` are delimited by delim.
   */
  var makeCompiler = function makeCompiler(delim, transform) {

    return function compiler(sections) {
      /* Literal delimiters must be escaped. To assist with parsing, replace
       * literal backquotes with a character sequence ("\um") that cannot
       * appear inside or outside of strings in JavaScript. */
      var code = sections.code.replace("\\" + delim, "\\um");

      var exprs = code.split(delim);

      /* If the delimiters are balanced, there will be an odd number of
       * splits. */
      if ((exprs.length % 2) === 0) {
        ERROR("unbalanced delimiters (" + delim + ") in binding");
        return null;
      }

      /* Delimited expressions will occur at every odd index. */
      var i = 1;
      for (; i < exprs.length; i += 2) {
        exprs[i] = transform(sections, exprs[i].replace("\\um", delim));
      }

      sections.code = exprs.join("").replace("\\um", delim);
      return sections;
    };

  };

  var exprCompiler = makeCompiler("`", function (sections, expr) {
    /* TODO: We could destroy this variable when the view it serves is
     * removed from the DOM. */
    var vvid = hd.__private.makeName("bindexpr");
    sections.data += "var " + vvid +
      " = hd.computed(function () { return (" + expr + "); }); ";
    return vvid;
  });

  var cmdCompiler = makeCompiler("@", function (sections, expr) {
    var fid = hd.__private.makeName("bindcmd");
    sections.data += "var " + fid +
      " = function " + fid + "() { return (" + expr + "); };";
    return fid;
  });

  var compile = function compile(bindingString) {
    var sections = {
      data: "",
      code: bindingString
    };

    sections = exprCompiler(sections);
    if (!sections) return;
    sections = cmdCompiler(sections);
    if (!sections) return;

    return "with ($context) { " + sections.data +
      "return ({ " + sections.code + " }); }";
  };

  /* @returns {Boolean}
   *   True if we should not recurse into the view's descendants, e.g., in
   *   the presence of a binder like foreach that handles the binding of
   *   descendants.
   */
  var bindElement = function bindElement(elt, context) {
    ASSERT(elt instanceof jQuery, "expected jQuery object");
    ASSERT(elt.length === 1, "expected a single element");
    LOG("Trying to bind #" + elt.attr("id"));

    /* Parse its bindings string. */
    var bindingString = elt.attr("data-bind");
    if (!bindingString) {
      return;
    }

    var functionBody = compile(bindingString);
    if (!functionBody) {
      return;
    }

    /* Credit to Knockout.js for this. */
    var i;
    for (i = context.$parents.length; i > 0; --i) {
      functionBody
        = "with ($context.$parents[" + (i - 1) + "]) { " + functionBody + " }";
    }
    LOG("functionBody = " + functionBody);
    try {
      var bindingMonad = new Function("$context", functionBody);
    } catch (meh) {
      ERROR("expected execution (not construction) of function to throw");
    }

    /* bindings is an object mapping a name of a binder to the value of its
     * options. In the context of the options:
     *
     * - Constants and expressions have already been evaluated.
     * - A variable reference (as opposed to value) will be represented by
     *   its proxy.
     * - This means we cannot yet bind to an expression. One option is to
     *   copy Knockout:
     *   1. Parse binding string as an object literal.
     *   2. For each property,
     *      2.a. Wrap the value (an expression) inside a computed variable.
     *      2.b. Pass the computed variable to the binder named by the key.
     */
    try {
      var bindings = bindingMonad(context);
    } catch (e) {
      var id = elt.attr("id");
      ERROR("cannot parse bindings on " +
            (id ? ("#" + id) : "(unidentified element)") + ":\n  \"" +
            bindingString + "\"\n  " +
            e);
      return true;
    }

    /* Built-in binders expect jQuery objects. */
    return bindAny(elt, bindings, context);
  };

  var Context = function Context($this, $parent, extras) {
    var ctx = (typeof $this === "object")
      ? Object.create($this.constructor.prototype)
      : this;

    ctx.$this = $this;

    if ($parent) {
      ctx.$parent = $parent;
      ctx.$parents = $parent.$parents.slice();
      ctx.$parents.unshift($parent);
    } else {
      ctx.$root = $this;
      ctx.$parents = [];
    }

    //if (typeof extras === "object") {
      //Object.extend(ctx, extras);
    //}

    if (Object.canHaveProperties($this)) {
      Object.extend(ctx, $this);
    }

    return ctx;
  };

  var bindTree = function bindTree(elts, context) {
    ASSERT(elts instanceof jQuery, "expected jQuery object");
    elts.each(function () {
      var elt = $(this);
      if (bindElement(elt, context)) {
        return;
      }
      bindTree(elt.children(), context);
    });
  };

  var subbind = function subbind(elts, value, parent, extras) {
    var context = new Context(value, parent, extras);
    bindTree(elts, context);
  };

  /* Have to take our parameters in the wrong conceptual order because we
   * have a default for the view. */
  var bind = function bind(model, elts) {
    if (!elts) {
      elts = $('body');
    }
    if (!(elts instanceof jQuery)) {
      elts = $(elts);
    }
    LOG("Binding " + elts.attr("id"));
    subbind(elts, model);
  };

  /* Note the difference in parameters between the two bind functions. */
  /* Called by users. */
  hd.bind     = bind;
  /* Called by binders. */
  hd.subbind  = subbind;
  hd.bindTree = bindTree;

}());

