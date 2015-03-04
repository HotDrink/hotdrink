
declare var process: {argv: string[]; hrtime: () => number[]};

declare function require( name: string ): any;

interface WritableStream {
  write( data: string ): void;
  writeln( data: string ): void;
  on( event: string, cb: Function ): void;
  end(): void;
}

interface FileSystem {
  readFileSync( fname: string, encoding: string ): string;
  createWriteStream( fname: string ): WritableStream;
}

declare function require( name: 'fs' ): FileSystem;