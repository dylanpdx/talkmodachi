.text
.align 4

.global getTtsData
getTtsData:
    push {r0-r4,lr}
    cpy r0, r8 @ Move r8 as argument 0
    bl saveTtsSettings
    pop {r0-r4,lr}
    str r0, [sp, #0x0] @ Instruction we replaced
    bx lr @ Return

.global audioDataGetAsm
audioDataGetAsm:
    push {r0-r4,lr}
    bl audioDataGet
    pop {r0-r4,lr}
    bx lr @ Return