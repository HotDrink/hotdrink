
SHELL           := /bin/bash

TSC_FLAGS       := --noImplicitAny -t ES5 -d --sourcemap

SOURCE_DIR      := src
MODULES_DIR     := modules
TARGET_DIR      := scripts
BUILD_DIR       := tmp

HOWTO_DIR       := docs/howto
PUBLISH_DIR     := publish
TANGLE_DIR      := tangle

######################################################################
# Module definitions

MODULES         := utility reactive graph model dfa plan enable system bind \
                   async hd qunit compile-dfa fn-worker

utility_LOC     := hd/
utility_UNITS   := adt helpers console schedule

reactive_LOC    := hd/
reactive_UNITS  := observable property extensions promise ladder function logger
reactive_DEPS   := utility

graph_LOC       := hd/
graph_UNITS     := walker digraph cgraph sgraph stay
graph_DEPS      := utility reactive

model_LOC       := hd/
model_UNITS     := ids variable method constraint model eqn builder path command
model_DEPS      := utility reactive

dfa_LOC         := hd/
dfa_UNITS       := monoid dfa compile
dfa_DEPS        := utility reactive graph model

plan_LOC        := hd/
plan_UNITS      := strengths planner quickplan dfaplan compplan
plan_DEPS       := utility reactive graph dfa

enable_LOC      := hd/
enable_UNITS    := egraph report check
enable_DEPS     := utility reactive graph

system_LOC      := hd/
system_UNITS    := system evaluate topo
system_DEPS     := utility reactive graph model plan enable

bind_LOC        := hd/
bind_UNITS      := binding text edit css select checked enable mouse position clicked time rx factory
bind_DEPS       := utility reactive model

async_LOC       := hd/
async_UNITS     := worker ajax
async_DEPS      := utility reactive

hd_UNITS        := api
hd_DEPS         := utility reactive model graph plan enable bind system

qunit_UNITS     := qunit.d utility reactive graph
qunit_DEPS      := utility reactive graph

compile-dfa_LOC   := apps/
compile-dfa_UNITS := ../node.d output main
compile-dfa_DEPS  := utility reactive model graph plan enable system bind hd dfa

fn-worker_LOC     := workers/
fn-worker_UNITS   := worker

######################################################################
# Documentation definitions


howto_UNITS  := index intro basics binding async program

howto_DEPS   := hotdrink.min.js fn-worker.js

howto_RES    := style.css spinner.gif

######################################################################
# Target definitions

TARGETS          := hotdrink qunit compile-dfa fn-worker

hotdrink_MODS    := utility reactive graph model dfa plan enable system bind async hd

qunit_MODS       := qunit

compile-dfa_MODS := shebang $(hotdrink_MODS) compile-dfa

fn-worker_MODS   := fn-worker

######################################################################
# Derived variables

# Map module names to resulting JS file names
MODULE_FILES := $(addprefix $(MODULES_DIR)/, $(addsuffix .js, $(MODULES)))

# Map module names to resulting map file names
MODULE_MAPS  := $(addprefix $(MODULES_DIR)/, $(addsuffix .js.map, $(MODULES)))

# Map module names to resulting definitions file names
MODULE_DEFS  := $(addprefix $(MODULES_DIR)/, $(addsuffix .d.ts, $(MODULES)))

# Map module's units to TS file names
$(foreach mod, $(MODULES), \
	$(eval $(mod)_MOD_FILES := $(addprefix $(SOURCE_DIR)/$($(mod)_LOC)$(mod)/, \
	                               $(addsuffix .ts, $($(mod)_UNITS)))))

# Map module's dependencies to definition file names
$(foreach mod, $(MODULES), \
	$(eval $(mod)_DEP_FILES := $(addprefix $(MODULES_DIR)/, \
	                               $(addsuffix .d.ts, $($(mod)_DEPS)))))

# Map target names to resulting JS file names
TARGET_FILES := $(addprefix $(TARGET_DIR)/, $(addsuffix .js, $(TARGETS)))

$(foreach tgt, $(TARGETS), \
	$(eval EXE_TARGET_FILES += $(if $(findstring shebang,$($(tgt)_MODS)), \
		$(addprefix $(TARGET_DIR)/,$(addsuffix .js,$(tgt))),)))

# Map target names to resulting map file names
TARGET_MAPS  := $(addprefix $(TARGET_DIR)/, $(addsuffix .js.map, $(TARGETS)))

# Map target's modules to JS file names
$(foreach tgt, $(TARGETS), \
	$(eval $(tgt)_TGT_FILES := \
		$(addprefix $(MODULES_DIR)/, $(addsuffix .js, $($(tgt)_MODS)))))

# Map target's modules to map file names
$(foreach tgt, $(TARGETS), \
	$(eval $(tgt)_TGT_MAPS := \
		$(addprefix $(MODULES_DIR)/, $(addsuffix .js.map, $($(tgt)_MODS)))))


howto_FILES  := $(addprefix $(HOWTO_DIR)/$(PUBLISH_DIR)/, $(addsuffix .html, $(howto_UNITS)))

howto_DEP_FILES := $(addprefix $(HOWTO_DIR)/$(PUBLISH_DIR)/, $(howto_DEPS))

howto_RES_FILES := $(addprefix $(HOWTO_DIR)/$(PUBLISH_DIR)/, $(howto_RES))

######################################################################
# Rules

help: mod := utility

.PHONY :
help:
	@echo "Make targets:"
	@echo "  hotdrink      - HotDrink library"
	@echo "  hotdrink.min  - HotDrink library (minified)"
	@echo "  qunit         - QUnit tests"
	@echo "  compile-dfa   - DFA compiler"
	@echo "  fn-worker     - Include file for a web worker"
	@echo "  howto         - All how-to documentation"
	@echo "  all           - all of the above"
	@echo "  clean         - remove all created files"

.PHONY :
.SECONDEXPANSION :
$(TARGETS) : % : $(TARGET_DIR)/$$*.js

.PHONY :
all : $(TARGETS) hotdrink.min howto

.PHONY :
clean :
	rm -rf $(MODULES_DIR) $(TARGET_DIR) $(BUILD_DIR) $(HOWTO_DIR)/$(PUBLISH_DIR) $(HOWTO_DIR)/$(TANGLE_DIR)

$(MODULES_DIR) $(TARGET_DIR) $(BUILD_DIR) $(HOWTO_DIR)/$(PUBLISH_DIR) $(HOWTO_DIR)/$(TANGLE_DIR) :
	mkdir $@

$(MODULE_DEFS) : $(MODULES_DIR)/%.d.ts : $(MODULES_DIR)/%.js ;

$(MODULE_MAPS) : $(MODULES_DIR)/%.js.map : $(MODULES_DIR)/%.js ;

.SECONDEXPANSION :
$(MODULE_FILES) : $(MODULES_DIR)/%.js : $$($$*_MOD_FILES) $$($$*_DEP_FILES) | $(MODULES_DIR) $(BUILD_DIR)
	tsc $(TSC_FLAGS) --out $(BUILD_DIR)/$*.js $^
	@if cmp -s $(BUILD_DIR)/$*.d.ts $(MODULES_DIR)/$*.d.ts ; then         \
	  echo 'make: $*.d.ts unchanged' ;                                    \
	  echo rm $(BUILD_DIR)/$*.d.ts ;                                      \
	  rm $(BUILD_DIR)/$*.d.ts ;                                           \
	  echo mv $(BUILD_DIR)/$*.js $(BUILD_DIR)/$*.js.map $(MODULES_DIR) ;  \
	  mv $(BUILD_DIR)/$*.js $(BUILD_DIR)/$*.js.map $(MODULES_DIR) ;       \
	else                                                                  \
	  echo mv $(BUILD_DIR)/$*.js $(BUILD_DIR)/$*.js.map                   \
	    $(BUILD_DIR)/$*.d.ts $(MODULES_DIR) ;                             \
	  mv $(BUILD_DIR)/$*.js $(BUILD_DIR)/$*.js.map                        \
	    $(BUILD_DIR)/$*.d.ts $(MODULES_DIR) ;                             \
	fi

$(TARGET_MAPS) : $(TARGET_DIR)/%.js.map : $(TARGET_DIR)/%.js ;

.SECONDEXPANSION :
$(TARGET_FILES) :: $(TARGET_DIR)/%.js : $$($$*_TGT_MAPS) $$($$*_TGT_FILES) | $(TARGET_DIR)
	@if which -s mapcat ; then                                                   \
	  echo mapcat -j $(TARGET_DIR)/$*.js -m $(TARGET_DIR)/$*.js.map              \
	    $($*_TGT_MAPS) ;                                                         \
	  mapcat -j $(TARGET_DIR)/$*.js -m $(TARGET_DIR)/$*.js.map $($*_TGT_MAPS) ;  \
	else                                                                         \
	  echo "make: *** Missing mapcat - cannot make scripts/$*.js.map" 1>&2 ;     \
	  echo cat $($*_TGT_FILES) ">" $@ ;                                          \
	  cat $($*_TGT_FILES) > $@ ;                                                 \
	fi

.SECONDEXPANSION :
$(EXE_TARGET_FILES) :: $(TARGET_DIR)/%.js : $$($$*_TGT_MAPS) $$($$*_TGT_FILES) | $(TARGET_DIR)
	chmod u+x $@

$(MODULES_DIR)/shebang.js.map : $(MODULES_DIR)/shebang.js ;

$(MODULES_DIR)/shebang.js : | $(MODULES_DIR)
	echo '#!/usr/bin/env node' > $@
	echo '{"version":3,"file":"shebang.js","sourceRoot":"","sources":["shebang.js"],"names":[],"mappings":""}' > $@.map

hotdrink.min : $(TARGET_DIR)/hotdrink.min.js

$(TARGET_DIR)/hotdrink.min.js.map: $(TARGET_DIR)/hotdrink.min.js

$(TARGET_DIR)/hotdrink.min.js : $(TARGET_DIR)/hotdrink.js
	uglifyjs $< -m -c warnings=false -o $@


howto: $(howto_DEP_FILES) $(howto_FILES) $(howto_RES_FILES)

$(howto_FILES) :: $(HOWTO_DIR)/$(PUBLISH_DIR)/%.html : $(HOWTO_DIR)/%.org publish-org.el | $(HOWTO_DIR)/$(TANGLE_DIR) $(HOWTO_DIR)/$(PUBLISH_DIR)
	emacs --batch -l publish-org.el $< -f publish-org-doc

$(howto_DEP_FILES) :: $(HOWTO_DIR)/$(PUBLISH_DIR)/% : $(TARGET_DIR)/% |  $(HOWTO_DIR)/$(PUBLISH_DIR)
	cp $< $@

$(howto_RES_FILES) :: $(HOWTO_DIR)/$(PUBLISH_DIR)/% : $(HOWTO_DIR)/% |  $(HOWTO_DIR)/$(PUBLISH_DIR)
	cp $< $@
