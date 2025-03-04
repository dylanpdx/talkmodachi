#---------------------------------------------------------------------------------
.SUFFIXES:
#---------------------------------------------------------------------------------

ifeq ($(strip $(DEVKITARM)),)
$(error "Please set DEVKITARM in your environment. export DEVKITARM=<path to>devkitARM")
endif


export PORTLIBS	:=	$(DEVKITPRO)/portlibs/arm
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
TARGET		:=	loader
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

CFLAGS	+=	$(INCLUDE) -DARM11 -D_3DS

CXXFLAGS	:= $(CFLAGS) -fno-rtti -fno-exceptions -std=gnu++11

ASFLAGS	:=	-g $(ARCH)
LDFLAGS	=	-T $(LINKERSCRIPT) -g $(ARCH) -Wl,-Map,$(notdir $*.map)

LIBS	:= -lctru -lm

#---------------------------------------------------------------------------------
# list of directories containing libraries, this must be the top level containing
# include and lib
#---------------------------------------------------------------------------------
LIBDIRS	:=	$(CTRULIB)  $(DEVKITARM) $(DEVKITARM)/arm-none-eabi 


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
 
export LIBPATHS	:=	$(foreach dir,$(LIBDIRS),-L$(dir)/lib) -L$(DEVKITARM)/lib/gcc/arm-none-eabi/7.1.0


.PHONY: $(BUILD) clean
  
#---------------------------------------------------------------------------------
$(BUILD):
	@[ -d $@ ] || mkdir -p $@
	@make --no-print-directory -C $(BUILD) -f $(CURDIR)/Makefile
 
#---------------------------------------------------------------------------------
clean:
	@echo clean ...
	@rm -fr $(BUILD) $(LINKERSCRIPT) $(TARGET).elf $(TARGET).bin $(TARGET).sym

#---------------------------------------------------------------------------------
else
 
#---------------------------------------------------------------------------------
# main targets
#---------------------------------------------------------------------------------


ifeq ($(strip $(CODEADDR)),)
$(error "The code destination has to be defined. CODEADDR=<address>")
endif

ifeq ($(strip $(DATAADDR)),)
$(error "The data destination has to be defined. DATAADDR=<address>")
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
        __text_end  = . ;
    }
    
    . = $(DATAADDR);
    .data : {
        __data_start = . ;
        *(.rodata)
        *(.data)
        *(.bss)
        *(COMMON)
        __data_end  = . ;
    }
}
endef
export LINKERSCRIPT_TEMPLATE

#---------------------------------------------------------------------------------



all: $(OUTPUT).bin $(OUTPUT).sym
	
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
	
