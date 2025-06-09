#---------------------------------------------------------------------------------
.SUFFIXES:
#---------------------------------------------------------------------------------

ifeq ($(strip $(DEVKITARM)),)
$(error "Please set DEVKITARM in your environment. export DEVKITARM=<path to>devkitARM")
endif

export PORTLIBS	:=	$(PORTLIBS_PATH)/armv6k $(PORTLIBS_PATH)/3ds
#export PORTLIBS	:=	$(DEVKITPRO)/portlibs/arm
export PATH		:=	$(DEVKITARM)/bin:$(PORTLIBS)/bin:$(PATH)
CTRULIB	:=	$(DEVKITPRO)/libctru

#---------------------------------------------------------------------------------
# the prefix on the compiler executables
#---------------------------------------------------------------------------------
PREFIX		:=	arm-none-eabi-

export CC	:=	$(PREFIX)gcc
export CXX	:=	$(PREFIX)g++
export AS	:=	$(PREFIX)as
export AR	:=	$(PREFIX)ar
export OBJCOPY	:=	$(PREFIX)objcopy
export OBJDUMP	:=	$(PREFIX)objdump


#---------------------------------------------------------------------------------
# TARGET is the name of the output
# BUILD is the directory where object files & intermediate files will be placed
# SOURCES is a list of directories containing source code
# DATA is a list of directories containing data files
# INCLUDES is a list of directories containing header files
#---------------------------------------------------------------------------------
TARGET		:=	newcode
BUILD		:=	build
SOURCES		:=	source
INCLUDES	:=	include


#---------------------------------------------------------------------------------
# options for code generation
#---------------------------------------------------------------------------------
ARCH	:=	-march=armv6k -mtune=mpcore -mfloat-abi=hard -mtp=soft -mfpu=vfpv2

CFLAGS	:=	-g -Wall -O2 -mword-relocations \
			-fomit-frame-pointer -ffunction-sections \
			$(ARCH)

ifndef REGION
#---------------------------------------------------------------------------------
# Determine REGION flag based on the hash of code.bin
#---------------------------------------------------------------------------------
CODE_BIN := $(if $(wildcard bak/code.bin),bak/code.bin,$(if $(wildcard /code.bin),/code.bin,))
ifeq ($(CODE_BIN),)
$(error "Neither bak/code.bin nor /code.bin exists. $(CURDIR)")
endif

REGION := UNK

SHA1_HASH := $(shell sha1sum $(CODE_BIN) | cut -d' ' -f1)

ifeq ($(SHA1_HASH),27cd9e76126b4e07bd6bcf43796e4988a178de87)
REGION := US
else ifeq ($(SHA1_HASH),8a63cdd2020b1422beedc20372659ebbfe5da09d)
REGION := EU
else ifeq ($(SHA1_HASH),a0488d72592c4572db5f52f608f60fff062fca1c)
REGION := KR
else ifeq ($(SHA1_HASH),d3f3c17705a8f539d6faab88e67a71f35c2039e3)
REGION := JP
else
$(error "Unknown hash for $(CODE_BIN): $(SHA1_HASH)")
endif
endif

CFLAGS	+=	$(INCLUDE) -D__3DS__ -DREGION_$(REGION)

CXXFLAGS	:= $(CFLAGS) -fno-rtti -fno-exceptions -std=gnu++11

ASFLAGS	:=	-g $(ARCH)
LDFLAGS	=	-T $(LINKERSCRIPT) -g $(ARCH) -Wl,-Map,$(notdir $*.map)

LIBS	:= -lctru -lm

#---------------------------------------------------------------------------------
# list of directories containing libraries, this must be the top level containing
# include and lib
#---------------------------------------------------------------------------------
LIBDIRS	:=	$(CTRULIB) $(DEVKITARM) $(DEVKITARM)/arm-none-eabi 


#---------------------------------------------------------------------------------
ifneq ($(BUILD),$(notdir $(CURDIR)))
#---------------------------------------------------------------------------------

export LINKERSCRIPT 	:=$(CURDIR)/linker.x

export OUTPUT	:=	$(CURDIR)/$(TARGET)

export VPATH	:=	$(foreach dir,$(SOURCES),$(CURDIR)/$(dir))

export DEPSDIR	:=	$(CURDIR)/$(BUILD)

CFILES		:=	$(foreach dir,$(SOURCES),$(notdir $(wildcard $(dir)/*.c)))
CPPFILES	:=	$(foreach dir,$(SOURCES),$(notdir $(wildcard $(dir)/*.cpp)))
SFILES		:=	$(foreach dir,$(SOURCES),$(notdir $(wildcard $(dir)/*.s)))

#---------------------------------------------------------------------------------
# use CXX for linking C++ projects, CC for standard C
#---------------------------------------------------------------------------------
ifeq ($(strip $(CPPFILES)),)
	export LD	:=	$(CC)
else
	export LD	:=	$(CXX)
endif


export OFILES	:=	$(CPPFILES:.cpp=.o) $(CFILES:.c=.o) $(SFILES:.s=.o)

export INCLUDE	:=	$(foreach dir,$(INCLUDES),-iquote $(CURDIR)/$(dir)) \
					$(foreach dir,$(LIBDIRS),-I$(dir)/include) \
					-I$(CURDIR)/$(BUILD)
 
export LIBPATHS	:=	-L$(DEVKITARM)/arm-none-eabi/lib/armv6k/fpu $(foreach dir,$(LIBDIRS),-L$(dir)/lib) -L$(DEVKITARM)/lib/gcc/arm-none-eabi/14.2.0


.PHONY: $(BUILD) clean
  
#---------------------------------------------------------------------------------
$(BUILD):
	@[ -d $@ ] || mkdir -p $@
	@make --no-print-directory -C $(BUILD) -f $(CURDIR)/Makefile REGION=$(REGION)

#---------------------------------------------------------------------------------
clean:
	@echo clean ...
	@rm -fr $(BUILD) $(LINKERSCRIPT) $(TARGET).elf $(TARGET).bin $(TARGET).sym source/main.hks

#---------------------------------------------------------------------------------
else
 
#---------------------------------------------------------------------------------
# main targets
#---------------------------------------------------------------------------------


ifeq ($(strip $(CODEADDR)),)
$(error "The code destination has to be defined. CODEADDR=<address>")
endif


#---------------------------------------------------------------------------------
# Linker Script Template
#---------------------------------------------------------------------------------

define LINKERSCRIPT_TEMPLATE
OUTPUT_ARCH(arm)

SECTIONS
{
    . = $(CODEADDR);
    .text : {
        __text_start = . ;
        *(.text)
        *(.text.*)
        *(.rodata)
        *(.data)
        *(.bss)
        *(COMMON)
        __text_end  = . ;
    }
	__end__ = .;
}
endef
export LINKERSCRIPT_TEMPLATE

#---------------------------------------------------------------------------------



all: copy_hooks $(OUTPUT).bin $(OUTPUT).sym

#---------------------------------------------------------------------------------
# Copy the appropriate hooks file based on REGION
#---------------------------------------------------------------------------------
HOOKS_FILE := ../hooks/main_$(REGION).rhks
TARGET_HOOKS := ../source/main.hks

.PHONY: copy_hooks

copy_hooks:
	@if [ ! -f $(HOOKS_FILE) ]; then \
		echo "Error: $(HOOKS_FILE) does not exist."; \
		exit 1; \
	fi
	@echo "Copying $(HOOKS_FILE) to $(TARGET_HOOKS)..."
	@cp "$(HOOKS_FILE)" "$(TARGET_HOOKS)"

$(OUTPUT).bin : $(OUTPUT).elf
	$(OBJCOPY) -O binary $< $@
	@echo built ... $(notdir $@)

$(OUTPUT).sym : $(OUTPUT).elf
	$(OBJDUMP) -t $< > $@
	@echo written the symbol table ... $(notdir $@)

#---------------------------------------------------------------------------------
%.elf: $(OFILES)
	@echo generating linker script
	echo "$$LINKERSCRIPT_TEMPLATE" > $(LINKERSCRIPT)
	
	@echo linking $(notdir $@)
	$(LD)  $(LDFLAGS) $(OFILES) $(LIBPATHS) $(LIBS) -o $@

#---------------------------------------------------------------------------------
%.o: %.cpp
	@echo $(notdir $<)
	$(CXX) -MMD -MP -MF $(DEPSDIR)/$*.d $(CXXFLAGS) -c $< -o $@ $(ERROR_FILTER)
	
#---------------------------------------------------------------------------------
%.o: %.c
	@echo $(notdir $<)
	$(CC) -MMD -MP -MF $(DEPSDIR)/$*.d $(CFLAGS) -c $< -o $@ $(ERROR_FILTER)
	
#---------------------------------------------------------------------------------
%.o: %.s
	@echo $(notdir $<)
	$(CC) -MMD -MP -MF $(DEPSDIR)/$*.d -x assembler-with-cpp $(ASFLAGS) -c $< -o $@ $(ERROR_FILTER)

-include $(DEPSDIR)/*.d
 
#---------------------------------------------------------------------------------------
endif
#---------------------------------------------------------------------------------------
	
