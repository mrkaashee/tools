export default {
  slots: {
    root: 'space-y-4 select-none',
    header: 'flex items-center justify-between px-1',
    title: 'text-[10px] font-bold uppercase tracking-widest text-muted',
    badge: '',
    previewContainer: 'relative group rounded-xl overflow-hidden border border-default bg-muted/50 shadow-md',
    checkerboard: 'absolute inset-0 z-0 opacity-20',
    imageWrapper: 'relative w-full aspect-video flex items-center justify-center p-2 z-10 backdrop-blur-[2px]',
    image: 'max-w-full max-h-full object-contain rounded drop-shadow-md transition-all duration-200',
    compareOverlay: 'absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-black/40',
    compareBadge: 'shadow-lg backdrop-blur-md',
    actions: 'flex gap-2',
    compareButton: 'flex-1 transition-transform duration-200 active:scale-[0.97]',
    exportButton: '',
    avatarRoot: 'relative rounded-full overflow-hidden shrink-0 bg-inverted/5 border border-default shadow-sm',
    avatarImage: 'absolute top-0 left-0 max-w-none origin-top-left z-10',
    avatarPlaceholder: 'absolute inset-0 flex items-center justify-center z-10'
  }
} as const
