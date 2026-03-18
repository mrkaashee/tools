export default {
  slots: {
    fixedWrapper: 'absolute inset-0 pointer-events-none',
    fixedMask: 'absolute pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.85)] z-40',
    fixedCrosshairX: 'absolute inset-x-0 top-1/2 h-px bg-white/10 -translate-y-1/2',
    fixedCrosshairY: 'absolute inset-y-0 left-1/2 w-px bg-white/10 -translate-x-1/2',
    movableWrapper: 'absolute inset-0 pointer-events-none group',
    movableMask: 'absolute inset-0 bg-inverted/60 backdrop-blur-[1px]',
    movableStencil: 'absolute pointer-events-auto cursor-move z-40 border border-white shadow-xl',
    gridWrapper: 'absolute inset-0 overflow-hidden',
    gridLineX: 'absolute left-0 w-full h-px bg-white/30',
    gridLineY: 'absolute top-0 h-full w-px bg-white/30',
    border: 'absolute inset-0 border border-white',
  },
  variants: {
    interacting: {
      true: {
        border: 'border-primary shadow-[0_0_30px_rgba(var(--color-primary-500),0.6)]',
      },
    },
  },
} as const
