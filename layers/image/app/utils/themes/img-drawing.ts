export default {
  slots: {
    root: 'relative w-full h-full flex flex-col',
    controls: 'flex gap-4 p-2 bg-elevated border-b border-muted flex-wrap items-center z-20',
    toolGroup: 'flex gap-1',
    properties: 'flex gap-4 flex-1 flex-wrap min-w-0',
    propertyItem: 'flex items-center gap-2',
    propertyLabel: 'text-[10px] uppercase font-bold text-muted whitespace-nowrap tracking-tight',
    propertyInput: 'w-8 h-8 rounded border border-muted cursor-pointer p-0 overflow-hidden',
    propertySlider: 'flex-1 min-w-30',
    historyGroup: 'flex gap-1',
    canvasContainer: 'relative flex-1 overflow-hidden bg-muted',
    baseCanvas: 'absolute inset-0 w-full h-full z-10',
    overlayCanvas: 'absolute inset-0 w-full h-full z-20 pointer-events-none'
  }
}
