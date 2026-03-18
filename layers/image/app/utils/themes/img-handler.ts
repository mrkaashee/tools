export default {
  slots: {
    root: 'absolute w-6 h-6 flex items-center justify-center pointer-events-auto z-50 hover:scale-110',
    dot: 'rounded-xs border-[1.5px] border-inverted relative z-10 shadow-sm group-hover:bg-primary group-hover:border-white group-hover:rounded-full [.group.is-active_&]:bg-primary [.group.is-active_&]:border-white [.group.is-active_&]:shadow-[0_0_10_rgba(var(--color-primary-500),0.5)] bg-primary border-white shadow-md shadow-primary/20',
    glow: 'absolute inset-0 bg-[radial-gradient(circle,--theme(--color-primary-500/0.4)_0%,transparent_70%)] opacity-0 pointer-events-none group-hover:opacity-100'
  },
  variants: {
    position: {
      'top-left': { root: '-top-3 -left-3' },
      'top-right': { root: '-top-3 -right-3' },
      'bottom-left': { root: '-bottom-3 -left-3' },
      'bottom-right': { root: '-bottom-3 -right-3' },
      top: { root: '-top-3 left-1/2 -translate-x-1/2' },
      bottom: { root: '-bottom-3 left-1/2 -translate-x-1/2' },
      left: { root: '-left-3 top-1/2 -translate-y-1/2' },
      right: { root: '-right-3 top-1/2 -translate-y-1/2' }
    },
    size: {
      sm: { dot: 'w-2 h-2' },
      md: { dot: 'w-2.5 h-2.5' },
      lg: { dot: 'w-3.5 h-3.5' }
    }
  }
}
