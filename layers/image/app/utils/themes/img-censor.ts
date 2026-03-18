export default {
  slots: {
    root: 'u-img-censor',
    sidebar: 'space-y-4',
    header: 'flex items-center justify-between',
    title: 'text-[10px] font-bold uppercase tracking-widest text-muted',
    modeGrid: 'grid grid-cols-2 gap-2',
    modeButton: '',
    controls: 'space-y-3',
    propRow: 'flex items-center justify-between',
    propTitle: 'text-[10px] text-muted uppercase font-medium',
    propValue: 'text-[10px] text-muted uppercase font-medium',
    propStack: 'space-y-1.5',
    actionButtons: 'flex gap-2',
    overlay: 'u-img-censor-overlay absolute inset-0 w-full h-full pointer-events-auto cursor-crosshair overflow-visible',
    box: 'u-img-censor-box absolute pointer-events-auto cursor-move group',
    deleteButton: 'absolute pointer-events-auto bg-black text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-red-500 transition-colors z-50 shadow-lg',
    selectionHighlight: 'absolute inset-0 group-[.is-interacting]:bg-primary/30 border-transparent transition-all duration-200 group-[.is-interacting]:border-primary'
  }
} as const
