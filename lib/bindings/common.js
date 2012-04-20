/**
 * @fileOverview <p>{@link hotdrink.bindings.common}</p>
 * @author John Freeman
 */

//provides("hotdrink.bindings.common");

(function () {

  var convertNumber = function convertNumber(vv) {
    var mv = (typeof vv === "string") ? parseFloat(vv) : vv;
    return (typeof mv !== "number" || isNaN(mv))
      ? { error : "Invalid number" }
      : { value : mv };
  };

  /* Export: */

  namespace.extend("hotdrink.bindings.common", {
    /* Converters and validators: */
    convertNumber : convertNumber
  });

}());

