export default {
  slots: {
    root: 'relative w-full h-full min-h-50 overflow-hidden bg-elevated select-none touch-action-none outline-none focus-visible:outline-2 focus-visible:outline-primary/50 focus-visible:-outline-offset-2',
    empty: 'flex items-center justify-center h-full text-muted text-sm',
    error: 'flex items-center justify-center h-full text-error text-sm',
    loader: 'absolute inset-0 flex items-center justify-center',
    spinner: 'w-10 h-10 border-[3px] border-inverted/10 border-t-inverted/60 rounded-full animate-spin',
    zoomContainer: 'absolute bottom-4 right-4 flex items-center gap-1 bg-inverted/75 backdrop-blur-md rounded-lg p-1.5 z-30 shadow-lg text-inverted',
    zoomPercentage: 'min-w-12 text-center text-inverted text-[11px] font-bold px-2 select-none',
    viewport: 'absolute inset-0',
    bgImage: 'absolute block pointer-events-none max-w-none transition-opacity duration-200 blur-xs',
    stencil: 'absolute box-border border-2 border-inverted/85 shadow-[0_0_0_9999px_--theme(--color-inverted/0.45)] transition-shadow duration-150',
    stencilWrapper: 'absolute inset-0 overflow-hidden',
    stencilImage: 'absolute block pointer-events-none max-w-none',
    circleHandle: 'absolute -inset-3 rounded-full border-16 border-transparent z-20 pointer-events-auto transition-colors duration-200 hover:border-primary/15',
    handle: 'absolute w-2.75 h-2.75 bg-primary border-2 border-white rounded-[2px] z-10 transition-all duration-150 hover:scale-[1.3] hover:bg-primary shadow-sm shadow-primary/30',
    grid: 'absolute inset-0 pointer-events-none',
    gridLine: 'absolute bg-inverted/20'
  }
} as const
