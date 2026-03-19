export default {
  slots: {
    root: 'flex flex-col w-full h-full bg-elevated overflow-hidden',
    header: 'shrink-0 w-full z-10',
    toolbar: 'flex-1 flex overflow-hidden relative',
    viewport: 'flex-1 overflow-hidden relative will-change-scroll',
    canvasWrapper: 'will-change-transform shrink-0',
    canvas: 'block w-full h-full shadow-2xl bg-default',
    image: 'block w-full h-full shadow-2xl bg-default object-cover pointer-events-none',
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
        aside: 'w-80 border-l border-muted max-lg:w-full max-lg:h-72 max-lg:border-l-0 max-lg:border-t',
      },
      left: {
        toolbar: 'flex-row-reverse max-lg:flex-col',
        aside: 'w-80 border-r border-muted max-lg:w-full max-lg:h-72 max-lg:border-r-0 max-lg:border-b',
      },
      top: {
        toolbar: 'flex-col',
        aside: 'w-full border-b border-muted h-64 max-lg:h-48',
      },
      bottom: {
        toolbar: 'flex-col-reverse',
        aside: 'w-full border-t border-muted h-64 max-lg:h-48',
      },
    },
    toolbarVariant: {
      sidebar: {
        aside: 'bg-elevated/80 backdrop-blur-md',
      },
      ghost: {
        aside: 'bg-transparent border-none shadow-none',
      },
      floating: {
        toolbar: 'relative h-full',
        aside: 'absolute z-30 bottom-12 left-1/2 -translate-x-1/2 w-fit h-auto max-w-[90%] bg-inverted/80 backdrop-blur-md border border-default/20 rounded-2xl shadow-2xl p-2 mb-safe-offset-4',
        asideContent: 'flex-row items-center gap-4 overflow-x-auto p-2 scrollbar-none snap-x',
      },
      bottom: {
        toolbar: 'flex-col-reverse relative h-full',
        aside: 'w-full h-auto border-t border-muted bg-elevated/90 backdrop-blur-xl shrink-0',
        asideContent: 'flex-row items-center gap-6 overflow-x-auto px-6 py-4 scrollbar-none snap-x',
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
        viewport: 'bg-inverted [background-image:linear-gradient(45deg,#151515_25%,transparent_25%),linear-gradient(-45deg,#151515_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#151515_75%),linear-gradient(-45deg,transparent_75%,#151515_75%)] [background-size:20px_20px] [background-position:0_0,0_10px,10px_-10px,-10px_0px]',
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
    interacting: {
      true: {
        viewport: '',
      },
    },
    panning: {
      true: {
        viewport: 'cursor-grab active:cursor-grabbing',
      },
    },
    visible: {
      true: {
        canvasWrapper: 'opacity-100',
      },
      false: {
        canvasWrapper: 'opacity-0',
      },
    },
    hidden: {
      true: {
        canvas: 'hidden',
      },
    },
  },
  defaultVariants: {
    toolbarPosition: 'right',
    toolbarVariant: 'sidebar',
    fixedStencil: false,
    hasBoard: true,
    hasBorder: false,
  },
} as const
