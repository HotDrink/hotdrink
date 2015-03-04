module hd.reactive {

  import u = hd.utility;

  export declare var plogger: PromiseLogger;

  export class PromiseLogger {

    private count = 1;

    private outstanding: u.ArraySet<Promise<any>> = [];

    register( p: Promise<any>, tag: string, reason?: string ) {
      if (p.id) {
        console.error( 'Logging problem: attempt to re-register promise ' + p.id );
      }
      else {
        p.id = tag + '#' + this.count++;
        // if (reason) {
        //   console.log( 'Promise created for ' + reason + ': ' + p.id );
        // }
        // else {
        //   console.log( 'Promise created:  ' + p.id );
        // }
      }
    }

    private checkId( p: Promise<any> ) {
      if (!p.id) {
        this.register( p, 'unknown' );
      }
    }

    nowHasDependencies( p: Promise<any> ) {
      this.checkId( p );
      u.arraySet.add( this.outstanding, p );
      console.log( 'Promise expected: ' + p.id );
    }

    lostAllDependencies( p: Promise<any> ) {
      this.checkId( p );
      u.arraySet.remove( this.outstanding, p );
      console.log( 'Promise dropped:  ' + p.id )
    }

    isSettled( p: Promise<any> ) {
      this.checkId( p );
      u.arraySet.remove( this.outstanding, p );
      console.log( 'Promise settled:  ' + p.id );
    }

    report() {
      if (this.outstanding.length) {
        console.log( 'Outstanding: ' +
                     this.outstanding.map( function( p: Promise<any> ) {
                       return p.id;
                     } ).join( ', ' )
                   );
      }
      else {
        console.log( 'No outstanding promises' );
      }
      return this.outstanding;
    }

  }

}