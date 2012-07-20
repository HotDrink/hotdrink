# Umbrella Makefile.

MAKEDIR := make
include $(MAKEDIR)/Makefile.common

PRIMARY := lib
BUILDDIR := build

##################################################
# self configuration (do not touch)

export MAKEDIR
export BUILDDIR

##################################################
# targets

.PHONY : all debug release doc test lint

all :
	@$(call defer,$(MAKEDIR)/Makefile.$(PRIMARY))

debug :
	@$(call defer,$(MAKEDIR)/Makefile.$(PRIMARY))

raw :
	@$(call defer,$(MAKEDIR)/Makefile.$(PRIMARY))

release :
	@$(call defer,$(MAKEDIR)/Makefile.$(PRIMARY))

doc :
	@$(call defer,$(MAKEDIR)/Makefile.$(PRIMARY))

test :
	@$(MAKE) -f $(MAKEDIR)/Makefile.test

lint :
	@$(call defer,$(MAKEDIR)/Makefile.$(PRIMARY))
	

##################################################
# cleaning

.PHONY : clean clean-obj clean-exe clean-doc clean-test

clean : clean-exe
	@$(MAKE) -f $(MAKEDIR)/Makefile.test clean-exe
	-rm -rf $(BUILDDIR)

clean-obj :
	@$(call defer,$(MAKEDIR)/Makefile.$(PRIMARY))

clean-exe :
	@$(call defer,$(MAKEDIR)/Makefile.$(PRIMARY))

clean-doc :
	@$(call defer,$(MAKEDIR)/Makefile.$(PRIMARY))

clean-test :
	@$(MAKE) -f $(MAKEDIR)/Makefile.test clean

