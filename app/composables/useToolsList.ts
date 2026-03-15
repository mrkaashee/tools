import type { NavigationMenuItem } from '@nuxt/ui'

export const useToolsList = () => {
  // category: { icon: 'i-lucide-code', label: 'Developer' },
  // { icon: 'i-lucide-image', label: 'Image' },
  // { icon: 'i-lucide-file-text', label: 'PDF' },

  const tools: NavigationMenuItem[] = [
    {
      label: 'JSON Formatter & Validator',
      description: 'Clean, prettify, and validate your JSON strings with ease.',
      category: { icon: 'i-lucide-braces', label: 'Developer' },
    },
    {
      label: 'Base64 Encoder & Decoder',
      description: 'Encode or decode text and images to Base64 format instantly.',
      category: { icon: 'i-lucide-arrow-right-left', label: 'Developer' },
    },
    {
      label: 'QR Code Generator',
      description: 'Generate free QR codes for URLs, text, and more. Customize colors and size.',
      category: { icon: 'i-lucide-qr-code', label: 'Developer' },
    },
    {
      label: 'Unix Epoch Converter',
      description: 'Convert Unix timestamps to human-readable dates and vice versa.',
      category: { icon: 'i-lucide-calendar-clock', label: 'Developer' },
    },
    {
      label: 'Byte Converter',
      description: 'Convert between data units: Bytes, KB, MB, GB, TB, PB and more.',
      category: { icon: 'i-lucide-cpu', label: 'Developer' },
    },
    {
      label: 'UUID Generator',
      description: 'Generate random (v4) or time-ordered (v7) UUIDs instantly.',
      category: { icon: 'i-lucide-fingerprint', label: 'Developer' },
    },
    {
      label: 'Number Base Converter',
      description: 'Convert numbers between decimal, binary, octal, and hexadecimal.',
      category: { icon: 'i-lucide-binary', label: 'Developer' },
    },
    {
      label: 'URL Encoder/Decoder',
      description: 'Encode or decode URL strings for safe transmission.',
      category: { icon: 'i-lucide-link', label: 'Developer' },
    },
    {
      label: 'HTML/XML Encoder',
      description: 'Encode or decode HTML and XML entities for safe web display.',
      category: { icon: 'i-lucide-code-2', label: 'Developer' },
    },
    {
      label: 'Gzip Compress/Decompress',
      description: 'Compress or decompress text using Gzip compression.',
      category: { icon: 'i-lucide-file-archive', label: 'Developer' },
    },
    {
      label: 'JSON Escape/Unescape',
      description: 'Escape or unescape special characters in JSON strings.',
      category: { icon: 'i-lucide-braces', label: 'Developer' },
    },
    {
      label: 'Cron Expression Parser',
      description: 'Parse and explain cron expressions with next run times.',
      category: { icon: 'i-lucide-calendar-clock', label: 'Developer' },
    },
    {
      label: 'Regex Tester',
      description: 'Test regular expressions with real-time matching and highlighting.',
      category: { icon: 'i-lucide-code-2', label: 'Developer' },
    },
    {
      label: 'Text Diff Comparison',
      description: 'Compare two texts and see the differences highlighted.',
      category: { icon: 'i-lucide-git-compare', label: 'Developer' },
    },
    {
      label: 'Markdown Preview',
      description: 'Write and preview Markdown in real-time with HTML export.',
      category: { icon: 'i-lucide-file-text', label: 'Developer' },
    },
    {
      label: 'Chmod Calculator',
      description: 'Convert Linux file permissions between Octal and Symbolic formats.',
      category: { icon: 'i-lucide-lock', label: 'Developer' },
    },
    {
      label: 'CSS/JS Minifier',
      description: 'Compress CSS and JavaScript code to reduce file size.',
      category: { icon: 'i-lucide-file-code', label: 'Developer' },
    },
    {
      label: 'IP Subnet Calculator',
      description: 'Calculate network, broadcast, host ranges, and more from IP/CIDR.',
      category: { icon: 'i-lucide-router', label: 'Developer' },
    },
    {
      label: 'Composerize',
      description: 'Convert Docker Run commands to Docker Compose YAML format.',
      category: { icon: 'i-lucide-container', label: 'Developer' },
    },
    {
      label: 'Docker Compose Builder',
      description: 'Build Docker Compose and Stack files visually with validation and download.',
      category: { icon: 'i-lucide-layers', label: 'Developer' },
    },

  ]

  return { tools }
}
