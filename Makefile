# Umbrella Makefile.

MAKEDIR := make
export MAKEDIR
include $(MAKEDIR)/Makefile.common

MODULE := lib

##################################################
# targets

.PHONY : all debug release syntax doc test

all :
	@$(call defer,$(MAKEDIR)/Makefile.$(MODULE))

debug :
	@$(call defer,$(MAKEDIR)/Makefile.$(MODULE))

release :
	@$(call defer,$(MAKEDIR)/Makefile.$(MODULE))

syntax :
	@$(call defer,$(MAKEDIR)/Makefile.$(MODULE))

doc :
	@$(call defer,$(MAKEDIR)/Makefile.$(MODULE))

test :
	@$(MAKE) -f $(MAKEDIR)/Makefile.test

##################################################
# cleaning

.PHONY : clean clean-obj clean-exe clean-doc clean-test

clean : clean-obj clean-exe clean-test

clean-obj :
	@$(call defer,$(MAKEDIR)/Makefile.$(MODULE))

clean-exe :
	@$(call defer,$(MAKEDIR)/Makefile.$(MODULE))

clean-doc :
	@$(call defer,$(MAKEDIR)/Makefile.$(MODULE))

clean-test :
	@$(MAKE) -f $(MAKEDIR)/Makefile.test clean

