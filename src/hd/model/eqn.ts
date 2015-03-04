module hd.model.eqn {

  /*==================================================================
   * Interface for any expression.
   */
  export interface Expression {

    // Return string containing JS code for this expression
    print(): string;

    // Does this expression contain any variables?
    hasVar(): boolean;

    // Get a path to variable node from this node
    find( varname: string ): string[];

    // Search for divisor; if found, replace with variable
    // node with specified name and return divisor
    extractDivisor( name: string ): Expression;
  }

  /*==================================================================
   * A numeric literal.
   */
  export class Number implements Expression {
    constructor( public text: string ) { }

    print() { return this.text; }

    hasVar() { return false; }

    find( varname: string ): string[] { return null; }

    extractDivisor( name: string ): Expression { return null; }
  }

  /*==================================================================
   * A variable reference.
   */
  export class Variable implements Expression {
    constructor( public name: string ) { }

    print() { return this.name; }

    hasVar() { return true; }

    find( varname: string ): string[] {
      return this.name == varname ? [] : null;
    }

    extractDivisor( name: string ): Expression { return null; }
  }

  /*==================================================================
   * A unary operation.
   */
  export class UnaryOperation implements Expression {
    constructor( public op: string, public expr: Expression) { }

    print() { return '(' + this.op + this.expr.print() + ')'; }

    hasVar() { return this.expr.hasVar(); }

    find( varname: string ) {
      var path = this.expr.find( varname );
      if (path) { path.unshift( 'expr' ); };
      return path;
    }

    extractDivisor( name: string ) {
      return this.expr.extractDivisor( name );
    }
  }

  /*==================================================================
   * A binary operation.
   */
  export class BinaryOperation implements Expression {
    constructor( public left: Expression,
                 public op: string,
                 public right: Expression ) { }

    print() {
      return '(' + this.left.print() + this.op + this.right.print() + ')';
    }

    hasVar() { return this.left.hasVar() || this.right.hasVar(); }

    find( varname: string ) {
      var path = this.left.find( varname );
      if (path) {
        path.unshift( 'left' );
      }
      else {
        path = this.right.find( varname );
        if (path) {
          path.unshift( 'right' );
        }
      }
      return path;
    }

    // Only extract divisor once
    private extracted = false;

    extractDivisor( name: string ) {
      var div = this.right.extractDivisor( name );
      if (! div) {
        div = this.left.extractDivisor( name );
        if (! div && this.op == '/') {
          if (! this.extracted) {
            if (this.right.hasVar()) {
              div = this.right;
              if (!(this.right instanceof Variable)) {
                this.right = new Variable( name );
              }
            }
            this.extracted = true;
          }
        }
      }
      return div;
    }
  }

  /*==================================================================
   * Record-type for equation.
   */
  export class Equation {
    constructor( public left: Expression,
                 public op: string,
                 public right: Expression ) { }
  }

  /*==================================================================
   * Parse string to generate equation.
   */
  export function parse( line: string ): Equation {
    var tokens: string[] =
          line.match( /((\d+(\.\d*)?)|(\.\d+))([eE][+-]?\d+)?|[\w$]+|[<>=]=|\S/g )
    var position = 0;

    var eq = parseEquation();

    if (position === tokens.length) {
      return eq;
    }
    else {
      throw "Unexpected token after equation ended: '" + tokens[position] + "'";
    }

    /*----------------------------------------------------------------
     * Factor := number
     *         | variable
     *         | unop Expression
     *         | ( Expression )
     */
    function parseFactor(): Expression {
      var tok = tokens[position++];
      if (tok.match( /^\.?\d/ )) {
        return new Number( tok );
      }
      else if (tok.match( /^[\w$]/ )) {
        return new Variable( tok );
      }
      else if (tok === '-') {
        var expr = parseFactor();
        return new UnaryOperation( '-', expr );
      }
      else if (tok === '(') {
        expr = parseExpression();
        tok = tokens[position++];
        if (tok !== ')') {
          throw "Expected ')' but found '" + tok + "''";
        }
        return expr;
      }

      throw "Expected value but found '" + tok + "'";
    }

    /*----------------------------------------------------------------
     * Term := Term * Term
     *       | Term / Term
     *       | Factor
     */
    function parseTerm(): Expression {
      var left = parseFactor();
      var op = tokens[position];
      while (op === '*' || op === '/') {
        ++position;
        var right = parseFactor();
        left = new BinaryOperation( left, op, right );
        op = tokens[position];
      }
      return left;
    }

    /*----------------------------------------------------------------
     * Expression := Expression + Expression
     *             | Expression - Expression
     *             | Term
     */
    function parseExpression(): Expression {
      var left = parseTerm();
      var op = tokens[position];
      while (op === '+' || op === '-') {
        ++position;
        var right = parseTerm();
        left = new BinaryOperation( left, op, right );
        op = tokens[position];
      }
      return left;
    }

    /*----------------------------------------------------------------
     * Equation := Expression == Expression
     *           | Expression <= Expression
     *           | Expression >= Expression
     */
    function parseEquation(): Equation {
      var left = parseExpression();
      var op = tokens[position++];
      if (! (op && op.match( /^[<>=]=$/ ))) {
        throw "Expected equality but found '" + op + "'";
      }
      var right = parseExpression();
      return new Equation( left, op, right );
    }

  }

  /*==================================================================
   * Generate JS code for body of function which solves for given
   * variable.
   */
  export function fnBody( inputs: string[],
                          output: string,
                          eq: Equation      ): string {

    var expr = solve( eq, output );

    if (expr) {
      var lines: string[] = [];

      // Extract out each divisor to check for (== 0)
      var i = 1;
      var name: string;
      do {
        do { name = 'd' + i++; } while (name == output || inputs.indexOf( name ) >= 0);
        var d = expr.extractDivisor( name );
        if (d) {
          if (d instanceof Variable) {
            lines.push( 'if (' + (<Variable>d).name + ' == 0) return ' + output + ';' );
          }
          else {
            lines.push( 'var ' + name + ' = ' + d.print() + ';' );
            lines.push( 'if (' + name + ' == 0) return ' + output + ';' );
          }
        }
      }
      while (d);

      // Perform calculation
      if (eq.op == '==') {
        lines.push( 'return ' + expr.print() + ';' );
      }
      else {
        lines.push( 'if (' + eq.left.print() +
                    eq.op + eq.right.print() + ')' );
        lines.push( '  return ' + output + ';' );
        lines.push( 'else' );
        lines.push( '  return ' + expr.print() + ';' );
      }

      return lines.join( '\n' );
    }
    else {
      return null;
    }
  }

  /*==================================================================
   * Solve equation for one variable.
   */
  function solve( eq: Equation, name: string ): Expression {
    var path = eq.left.find( name );
    if (path) {
      return reduce( eq.left, eq.right );
    }
    else {
      path = eq.right.find( name );
      if (path) {
        return reduce( eq.right, eq.left );
      }
      else {
        return null;
      }
    }

    /*----------------------------------------------------------------
     * Reduce left expression down until only variable remains;
     * each reduction is mirrored in right expression.
     */
    function reduce( left: Expression, right: Expression ): Expression {
      if (path.length == 0) {
        return right;
      }

      if (left instanceof UnaryOperation) {
        var u = <UnaryOperation>left;
        path.shift();
        return reduce( u.expr, new UnaryOperation( u.op, right ) );
      }
      else if (left instanceof BinaryOperation) {
        var b = <BinaryOperation>left;
        if (b.op === '+') {
          if (path.shift() === 'left') {
            return reduce( b.left, new BinaryOperation( right, '-', b.right ) );
          }
          else {
            return reduce( b.right, new BinaryOperation( right, '-', b.left ) );
          }
        }
        else if (b.op === '-') {
          if (path.shift() === 'left') {
            return reduce( b.left, new BinaryOperation( right, '+', b.right ) );
          }
          else {
            return reduce( b.right, new BinaryOperation( b.left, '-', right ) );
          }
        }
        else if (b.op === '*') {
          if (path.shift() === 'left') {
            return reduce( b.left, new BinaryOperation( right, '/', b.right ) );
          }
          else {
            return reduce( b.right, new BinaryOperation( right, '/', b.left ) );
          }
        }
        else if (b.op === '/') {
          if (path.shift() === 'left') {
            return reduce( b.left, new BinaryOperation( right, '*', b.right ) );
          }
          else {
            return reduce( b.right, new BinaryOperation( b.left, '/', right ) );
          }
        }
      }
    }
  }

}