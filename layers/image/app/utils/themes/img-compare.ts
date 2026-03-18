export default {
  slots: {
    root: 'relative w-full h-full overflow-hidden select-none group rounded-lg',
    afterImage: 'absolute inset-0 w-full h-full object-contain pointer-events-none',
    beforeWrapper: 'absolute inset-0 w-full h-full overflow-hidden pointer-events-none',
    beforeImage: 'absolute inset-0 w-full h-full object-contain pointer-events-none',
    slider: 'absolute inset-y-0 z-20 w-10 -ml-5 cursor-ew-resize touch-none flex flex-col items-center group-hover:opacity-100 transition-opacity',
    divider: 'absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-white/50 backdrop-blur-sm',
    handle: 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-primary z-30 transition-transform group-hover:scale-110 active:scale-95',
    handleIcon: 'flex gap-0.5 pointer-events-none',
    handleBar: 'w-0.5 h-3 bg-primary rounded-full',
    labelBefore: 'absolute top-4 left-4 z-30 pointer-events-none',
    labelAfter: 'absolute top-4 right-4 z-30 pointer-events-none',
    badge: 'backdrop-blur-md border-none text-[10px] uppercase tracking-wider',
    hintWrapper: 'absolute bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300',
    hint: 'px-3 py-1 bg-black/60 backdrop-blur-md text-white rounded-full text-[10px] font-medium'
  }
}
