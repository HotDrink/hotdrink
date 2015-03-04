
module hd.async {

  import u = hd.utility;
  import r = hd.reactive;

  function makeQueryString( data: u.Dictionary<any>  ) {
    var params: string[] = [];
    for (var key in data) {
      params.push( key + '=' + encodeURIComponent( data[key] ) );
    }
    return params.join( '&' );
  }

  export
  function ajax( url: string, data: u.Dictionary<any> ) {
    if (data) {
      url += '?' + makeQueryString( data );
    }
    var ajax = new XMLHttpRequest();
    var p = new r.Promise();
    ajax.addEventListener( 'readystatechange', function() {
      if (ajax.readyState == 4) {
        if (ajax.status == 200) {
          p.resolve( ajax );
        }
        else {
          p.reject( ajax.statusText );
        }
      }
    } );
    ajax.open( 'GET', url );
    ajax.send();
    return p;
  }

  export
  function ajaxXML( url: string, data: u.Dictionary<any> ) {
    return ajax( url, data ).then( function( ajax: XMLHttpRequest ) {
      return ajax.responseXML;
    } );
  }

  export
  function ajaxText( url: string, data: u.Dictionary<any> ) {
    return ajax( url, data ).then( function( ajax: XMLHttpRequest ) {
      return ajax.responseText;
    } );
  }

  export
  function ajaxJSON( url: string, data: u.Dictionary<any> ) {
    return ajax( url, data ).then( function( ajax: XMLHttpRequest ) {
      return JSON.parse( ajax.responseText );
    } );
  }

}

module hd {
  export var ajax = hd.async.ajax;
  export var ajaxXML = hd.async.ajaxXML;
  export var ajaxText = hd.async.ajaxText;
  export var ajaxJSON = hd.async.ajaxJSON;
}
