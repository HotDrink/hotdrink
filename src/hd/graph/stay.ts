/*====================================================================
 * There are no stay constraints in the model; they exist only in the
 * constraint graph.  Thus, we create ids for them, but the ids do not
 * map to any actual objects.  The mapping between a variable id and
 * the corresponding stay constraint id is performed by a simple
 * string manipulation: simply take the id of the variable and append
 * "#sc" to the end.  Similarly, the single method of the stay
 * constraint (the "stay method") simply takes the id of the variable
 * and appends "#sm" to the end.  The following functions facilitate
 * that mapping.
 */

module hd.graph {

  /*------------------------------------------------------------------
   * Map variable id to stay method id.
   */
  export function stayMethod( vid: string ): string {
    return vid + '#sm';
  }

  /*------------------------------------------------------------------
   * Map variable id to stay constraint id.
   */
  export function stayConstraint( vid: string ): string {
    return vid + '#sc';
  }

  /*------------------------------------------------------------------
   * Test whether specified method id is a stay method id.
   */
  export function isStayMethod( mid: string ): boolean {
    return (mid.substr( -3 ) == '#sm');
  }

  /*------------------------------------------------------------------
   * Test whether specified method id is NOT a stay method id.
   */
  export function isNotStayMethod( cid: string ): boolean {
    return (cid.substr( -3 ) != '#sm');
  }

  /*------------------------------------------------------------------
   * Test whether specified constraint id is a stay constraint id.
   */
  export function isStayConstraint( cid: string ): boolean {
    return (cid.substr( -3 ) == '#sc');
  }

  /*------------------------------------------------------------------
   * Test whether specified constraint id is NOT a stay constraint id.
   */
  export function isNotStayConstraint( cid: string ): boolean {
    return (cid.substr( -3 ) != '#sc');
  }

}