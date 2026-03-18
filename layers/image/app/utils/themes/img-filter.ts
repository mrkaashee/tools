export default {
  slots: {
    root: 'space-y-4 pt-2',
    header: 'flex items-center justify-between px-1',
    title: 'text-[10px] font-bold uppercase tracking-widest text-muted',
    resetButton: '',
    presets: 'flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1',
    preset: '',
    accordion: '',
    control: 'px-1 space-y-3',
    controlHeader: 'flex justify-between items-center',
    controlLabel: 'text-[11px] font-medium text-default capitalize',
    controlValue: 'text-[11px] font-bold text-primary tabular-nums',
    slider: 'w-full'
  }
} as const
