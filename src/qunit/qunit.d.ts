
declare function module( name: string ): void;

declare function test( name: string, body: () => void ): void;
declare function asyncTest( name: string, body: () => void): void;

declare function expect( count: number ): void;

declare function ok( truthy: any, message: string ): void;

declare function equal( left: any, right: any, message: string ): void;
declare function strictEqual( left: any, right: any, message: string ): void;
declare function deepEqual( left: any, right: any, message: string ): void;

declare function notEqual( left: any, right: any, message: string ): void;
declare function notStrictEqual( left: any, right: any, message: string ): void;
declare function notDeepEqual( left: any, right: any, message: string ): void;

declare function start(): void;
declare function stop(): void;