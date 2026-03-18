export default {
  slots: {
    root: 'flex flex-col gap-3',
    header: 'flex items-center justify-between px-2',
    title: 'text-[10px] font-bold uppercase tracking-widest text-muted',
    addButton: '',
    list: 'flex flex-col gap-1',
    item: 'flex items-center gap-3 p-2 bg-inverted/5 border border-transparent rounded-lg cursor-pointer transition-all duration-200 hover:bg-inverted/10 group',
    itemActive: 'is-active bg-primary/10 border-primary/30',
    itemHidden: 'opacity-50',
    visibilityIcon: 'text-muted text-sm transition-colors hover:text-highlighted group-[.is-active]:text-primary',
    thumbnail: 'w-8 h-8 flex items-center justify-center bg-default rounded border border-muted text-muted transition-colors group-[.is-active]:bg-primary group-[.is-active]:text-inverted group-[.is-active]:border-primary',
    content: 'flex-1 flex flex-col overflow-hidden',
    name: 'text-[13px] font-medium text-default truncate',
    type: 'text-[10px] text-muted uppercase tracking-tight',
    deleteButton: 'opacity-0 group-hover:opacity-100 text-muted transition-all hover:text-error'
  }
} as const
