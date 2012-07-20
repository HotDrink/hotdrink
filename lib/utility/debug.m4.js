/* included debug macros m4_divert(`-1')
# Prevent as much of this file as possible from being included in the output.

# Define the macros in JavaScript in case m4 is not available. This will allow
# the macro-littered code to parse as JavaScript, but there are no gaurantees
# that any of the macros will be meaningful.
m4_ifelse(`
*/
var noop = function () {};
var LOG = noop;
var ASSERT = noop;
var ERROR = noop;
var WARNING = noop;
var DEBUG_BEGIN;
var DEBUG_END;
/*
')

m4_changequote([,])

# Taken from example in the documentation

# joinall(sep, args) - join each ARG, including empty ones,
# into a single string, with each element separated by SEP
m4_define([M4_JOINALL], [<{$2}>_$0(<{$1}>, m4_shift($@))])
m4_define([_M4_JOINALL],
[m4_ifelse(<{$#}>, <{2}>, <{}>, <{<{$1$3}>$0(<{$1}>, m4_shift(m4_shift($@)))}>)])

m4_define([DEBUG_DEFINE],[m4_define([$1],[m4_ifdef(<{DEBUG}>,<{$2}>,)
m4_dnl])])

m4_define([NDEBUG_DEFINE],[m4_define([$1],[m4_ifdef(<{DEBUG}>,,<{$2}>)
m4_dnl])])

DEBUG_DEFINE([LOG],[raid.log("m4___file__:m4___line__: " + $*);])

# Works much like assert() in C.
DEBUG_DEFINE([ASSERT],
[if (!($1)) {
  ERROR(m4_ifelse(<{$*}>,,<{"assertion failed "}>,<{m4_shift($*)}>));
}])

# Works much like warn() in GCC.
DEBUG_DEFINE([WARNING],[raid.warning("m4___file__:m4___line__: " + M4_JOINALL(<{, }>,$*));])

# Works much like error() in GCC.
DEBUG_DEFINE([ERROR],[raid.error("m4___file__:m4___line__: " + M4_JOINALL(<{, }>,$*));])

# DEBUG_BEGIN and DEBUG_END are used to surround debug-only sections of code.
NDEBUG_DEFINE([DEBUG_BEGIN],[m4_divert(<{-1}>)])
NDEBUG_DEFINE([DEBUG_END],[m4_divert])

m4_changequote(<{,}>)
m4_changecom

m4_divert m4_dnl
*/
