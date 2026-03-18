export default {
  slots: {
    root: 'flex flex-col w-full h-full bg-elevated overflow-hidden',
    header: 'shrink-0 w-full z-10',
    toolbar: 'flex-1 flex overflow-hidden relative',
    viewport: 'flex-1 overflow-hidden relative will-change-scroll',
    canvasWrapper: 'will-change-transform shrink-0',
    canvas: 'block w-full h-full shadow-2xl bg-default',
    image: 'block w-full h-full shadow-2xl bg-default object-contain pointer-events-none',
    floatingBar: 'absolute z-40 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1.5 rounded-xl bg-inverted/80 backdrop-blur-md border border-default/20 shadow-xl',
    aside: 'bg-elevated/80 backdrop-blur-md flex flex-col z-10 transition-all duration-300 ease-in-out',
    asideContent: 'flex-1 overflow-y-auto p-6 flex flex-col gap-6 scrollbar-thin scrollbar-thumb-accented scrollbar-track-transparent',
    uploader: 'flex flex-col items-center justify-center w-full h-full min-h-64 bg-inverted rounded-xl border border-inverted/5 p-8',
    emptyState: 'absolute inset-0 flex flex-col items-center justify-center z-10 p-12',
    emptyStateContainer: 'w-full max-w-md flex flex-col items-center gap-6',
    emptyStateIconWrapper: 'w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20',
    emptyStateIcon: 'w-8 h-8 text-primary',
    emptyStateText: 'text-center space-y-1',
    emptyStateTitle: 'text-sm font-semibold text-highlighted',
    emptyStateDescription: 'text-xs text-muted',
  },
  variants: {
    toolbarPosition: {
      right: {
        toolbar: 'flex-row max-lg:flex-col',
        aside: 'w-80 border-l border-muted max-lg:w-full max-lg:h-87.5 max-lg:border-l-0 max-lg:border-t',
      },
      left: {
        toolbar: 'flex-row-reverse max-lg:flex-col',
        aside: 'w-80 border-r border-muted max-lg:w-full max-lg:h-87.5 max-lg:border-r-0 max-lg:border-b',
      },
      top: {
        toolbar: 'flex-col',
        aside: 'w-full border-b border-muted h-64',
      },
      bottom: {
        toolbar: 'flex-col-reverse',
        aside: 'w-full border-t border-muted h-64',
      },
    },
    fixedStencil: {
      true: {
        viewport: 'bg-black/95',
        canvasWrapper: 'absolute top-0 left-0',
      },
      false: {
        viewport: 'flex items-center justify-center',
        canvasWrapper: 'relative',
      },
    },
    hasBoard: {
      true: {
        viewport: 'bg-inverted',
      },
      false: {
        viewport: 'bg-default',
      },
    },
    hasBorder: {
      true: {
        root: 'border border-default rounded-xl',
      },
    },
  },
  defaultVariants: {
    toolbarPosition: 'right',
    fixedStencil: false,
    hasBoard: true,
    hasBorder: false,
  },
} as const
