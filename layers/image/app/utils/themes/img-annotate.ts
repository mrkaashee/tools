export default {
  slots: {
    root: 'space-y-4 select-none',
    header: 'flex items-center justify-between',
    title: 'text-[10px] font-bold uppercase tracking-widest text-muted',
    toolGrid: 'grid grid-cols-4 gap-2',
    toolButton: '',
    properties: 'bg-muted p-2 rounded-lg space-y-3',
    propHeader: 'flex items-center justify-between',
    propTitle: 'text-[10px] font-bold uppercase text-primary',
    inputLabel: 'text-[10px] text-muted uppercase font-medium',
    input: '',
    colorPicker: 'h-6 w-6 rounded border-0 p-0',
    globalProps: 'space-y-4 border-t border-default pt-4',
    actionButtons: 'flex gap-2',
    applyButton: 'pt-2',
    svg: 'u-img-annotate-svg absolute inset-0 w-full h-full pointer-events-auto overflow-visible'
  }
} as const
