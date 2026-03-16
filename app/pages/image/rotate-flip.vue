<script lang="ts" setup>
const editorRef = ref()
const transformRef = ref()

const downloadResult = async () => {
  if (editorRef.value) {
    await editorRef.value.applyAndExport('transformed-image.png')
  }
}
</script>

<template>
  <ImgToolPage
    title="Image Rotate & Flip"
    description="Rotate images by any angle and flip them horizontally or vertically."
    icon="i-lucide-rotate-cw">
    <template #default="{ img }">
      <div class="absolute inset-0 h-full w-full">
        <ImgEditor ref="editorRef" :src="img" borderless>
          <template #header>
            <div class="hidden" />
          </template>
          <template #default>
            <ImgTransform ref="transformRef" />
          </template>
        </ImgEditor>
      </div>
    </template>

    <template #actions>
      <div class="flex gap-2">
        <UButton
          label="Undo"
          icon="i-lucide-undo"
          variant="ghost"
          color="neutral"
          :disabled="!editorRef?.canUndo"
          @click="editorRef?.undo()" />
        <UButton
          label="Redo"
          icon="i-lucide-redo"
          variant="ghost"
          color="neutral"
          :disabled="!editorRef?.canRedo"
          @click="editorRef?.redo()" />
        <UButton
          label="Download Result"
          icon="i-lucide-download"
          @click="downloadResult" />
      </div>
    </template>

    <template #sidebar>
      <div class="bg-elevated p-6 rounded-xl border border-muted space-y-4">
        <h3 class="font-semibold text-sm">
          Rotate
        </h3>
        <div class="grid grid-cols-2 gap-2">
          <UButton
            label="90° Left"
            icon="i-lucide-rotate-ccw"
            variant="outline"
            color="neutral"
            block
            @click="transformRef?.rotate(-90)" />
          <UButton
            label="90° Right"
            icon="i-lucide-rotate-cw"
            variant="outline"
            color="neutral"
            block
            @click="transformRef?.rotate(90)" />
          <UButton
            label="180°"
            icon="i-lucide-refresh-cw"
            variant="outline"
            color="neutral"
            block
            @click="transformRef?.rotate(180)" />
        </div>
      </div>

      <div class="bg-elevated p-6 rounded-xl border border-muted space-y-4">
        <h3 class="font-semibold text-sm">
          Flip
        </h3>
        <div class="grid grid-cols-2 gap-2">
          <UButton
            label="Horizontal"
            icon="i-lucide-flip-horizontal"
            variant="outline"
            color="neutral"
            block
            @click="transformRef?.flipHorizontal()" />
          <UButton
            label="Vertical"
            icon="i-lucide-flip-vertical"
            variant="outline"
            color="neutral"
            block
            @click="transformRef?.flipVertical()" />
        </div>
      </div>
    </template>
  </ImgToolPage>
</template>
