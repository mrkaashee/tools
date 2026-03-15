export interface Tool {
  icon: string
  label: string
  description: string
  category: { icon: string, label: string }
}

export const useToolsList = () => {
  const tools: Tool[] = [
    // Developer
    {
      icon: 'i-lucide-braces',
      label: 'JSON Formatter & Validator',
      description: 'Clean, prettify, and validate your JSON strings with ease.',
      category: { icon: 'i-lucide-code', label: 'Developer' },
    },
    {
      icon: 'i-lucide-arrow-right-left',
      label: 'Base64 Encoder & Decoder',
      description: 'Encode or decode text and images to Base64 format instantly.',
      category: { icon: 'i-lucide-code', label: 'Developer' },
    },
    {
      icon: 'i-lucide-qr-code',
      label: 'QR Code Generator',
      description: 'Generate free QR codes for URLs, text, and more. Customize colors and size.',
      category: { icon: 'i-lucide-code', label: 'Developer' },
    },
    {
      icon: 'i-lucide-calendar-clock',
      label: 'Unix Epoch Converter',
      description: 'Convert Unix timestamps to human-readable dates and vice versa.',
      category: { icon: 'i-lucide-code', label: 'Developer' },
    },
    {
      icon: 'i-lucide-cpu',
      label: 'Byte Converter',
      description: 'Convert between data units: Bytes, KB, MB, GB, TB, PB and more.',
      category: { icon: 'i-lucide-code', label: 'Developer' },
    },
    {
      icon: 'i-lucide-fingerprint',
      label: 'UUID Generator',
      description: 'Generate random (v4) or time-ordered (v7) UUIDs instantly.',
      category: { icon: 'i-lucide-code', label: 'Developer' },
    },
    {
      icon: 'i-lucide-binary',
      label: 'Number Base Converter',
      description: 'Convert numbers between decimal, binary, octal, and hexadecimal.',
      category: { icon: 'i-lucide-code', label: 'Developer' },
    },
    {
      icon: 'i-lucide-link',
      label: 'URL Encoder/Decoder',
      description: 'Encode or decode URL strings for safe transmission.',
      category: { icon: 'i-lucide-code', label: 'Developer' },
    },
    {
      icon: 'i-lucide-code-2',
      label: 'HTML/XML Encoder',
      description: 'Encode or decode HTML and XML entities for safe web display.',
      category: { icon: 'i-lucide-code', label: 'Developer' },
    },
    {
      icon: 'i-lucide-file-archive',
      label: 'Gzip Compress/Decompress',
      description: 'Compress or decompress text using Gzip compression.',
      category: { icon: 'i-lucide-code', label: 'Developer' },
    },
    {
      icon: 'i-lucide-braces',
      label: 'JSON Escape/Unescape',
      description: 'Escape or unescape special characters in JSON strings.',
      category: { icon: 'i-lucide-code', label: 'Developer' },
    },
    {
      icon: 'i-lucide-calendar-clock',
      label: 'Cron Expression Parser',
      description: 'Parse and explain cron expressions with next run times.',
      category: { icon: 'i-lucide-code', label: 'Developer' },
    },
    {
      icon: 'i-lucide-regex',
      label: 'Regex Tester',
      description: 'Test regular expressions with real-time matching and highlighting.',
      category: { icon: 'i-lucide-code', label: 'Developer' },
    },
    {
      icon: 'i-lucide-git-compare',
      label: 'Text Diff Comparison',
      description: 'Compare two texts and see the differences highlighted.',
      category: { icon: 'i-lucide-code', label: 'Developer' },
    },
    {
      icon: 'i-lucide-file-text',
      label: 'Markdown Preview',
      description: 'Write and preview Markdown in real-time with HTML export.',
      category: { icon: 'i-lucide-code', label: 'Developer' },
    },
    {
      icon: 'i-lucide-lock',
      label: 'Chmod Calculator',
      description: 'Convert Linux file permissions between Octal and Symbolic formats.',
      category: { icon: 'i-lucide-code', label: 'Developer' },
    },
    {
      icon: 'i-lucide-file-code',
      label: 'CSS/JS Minifier',
      description: 'Compress CSS and JavaScript code to reduce file size.',
      category: { icon: 'i-lucide-code', label: 'Developer' },
    },
    {
      icon: 'i-lucide-network',
      label: 'IP Subnet Calculator',
      description: 'Calculate network, broadcast, host ranges, and more from IP/CIDR.',
      category: { icon: 'i-lucide-code', label: 'Developer' },
    },
    {
      icon: 'i-lucide-container',
      label: 'Composerize',
      description: 'Convert Docker Run commands to Docker Compose YAML format.',
      category: { icon: 'i-lucide-code', label: 'Developer' },
    },
    {
      icon: 'i-lucide-layers',
      label: 'Docker Compose Builder',
      description: 'Build Docker Compose and Stack files visually with validation and download.',
      category: { icon: 'i-lucide-code', label: 'Developer' },
    },
    // Image
    {
      icon: 'i-lucide-crop',
      label: 'Image Cropper',
      description: 'Crop images to any aspect ratio with precision.',
      category: { icon: 'i-lucide-image', label: 'Image' },
    },
    {
      icon: 'i-lucide-scaling',
      label: 'Image Resizer',
      description: 'Change image dimensions while maintaining quality.',
      category: { icon: 'i-lucide-image', label: 'Image' },
    },
    {
      icon: 'i-lucide-refresh-ccw',
      label: 'Image Converter',
      description: 'Convert between PNG, JPG, WebP, and other formats.',
      category: { icon: 'i-lucide-image', label: 'Image' },
    },
    {
      icon: 'i-lucide-shrink',
      label: 'Image Compressor',
      description: 'Optimize and compress images for faster web loading.',
      category: { icon: 'i-lucide-image', label: 'Image' },
    },
    {
      icon: 'i-lucide-file-image',
      label: 'SVG to PNG Converter',
      description: 'Quickly convert SVG vector files to PNG images.',
      category: { icon: 'i-lucide-image', label: 'Image' },
    },
    // Security / Crypto
    {
      icon: 'i-lucide-shield',
      label: 'Hash Generator',
      description: 'Generate MD5, SHA-1, SHA-256, and SHA-512 hashes from text.',
      category: { icon: 'i-lucide-shield-check', label: 'Security' },
    },
    {
      icon: 'i-lucide-key-round',
      label: 'Password Generator',
      description: 'Generate strong, random passwords with custom rules.',
      category: { icon: 'i-lucide-shield-check', label: 'Security' },
    },
    {
      icon: 'i-lucide-ticket',
      label: 'JWT Decoder',
      description: 'Decode and inspect JSON Web Token headers and payloads.',
      category: { icon: 'i-lucide-shield-check', label: 'Security' },
    },
    {
      icon: 'i-lucide-lock-keyhole',
      label: 'Bcrypt Hash Generator',
      description: 'Hash and verify passwords using the bcrypt algorithm.',
      category: { icon: 'i-lucide-shield-check', label: 'Security' },
    },
    {
      icon: 'i-lucide-scan-line',
      label: 'HMAC Generator',
      description: 'Generate HMAC signatures using SHA-256, SHA-512 and more.',
      category: { icon: 'i-lucide-shield-check', label: 'Security' },
    },
    {
      icon: 'i-lucide-shuffle',
      label: 'Random String Generator',
      description: 'Generate cryptographically secure random strings and tokens.',
      category: { icon: 'i-lucide-shield-check', label: 'Security' },
    },
    // Text
    {
      icon: 'i-lucide-type',
      label: 'Case Converter',
      description: 'Convert text between camelCase, snake_case, PascalCase, and more.',
      category: { icon: 'i-lucide-text', label: 'Text' },
    },
    {
      icon: 'i-lucide-file-pen-line',
      label: 'Lorem Ipsum Generator',
      description: 'Generate dummy lorem ipsum placeholder text for layouts.',
      category: { icon: 'i-lucide-text', label: 'Text' },
    },
    {
      icon: 'i-lucide-bar-chart-2',
      label: 'Word & Char Counter',
      description: 'Count words, characters, sentences, and paragraphs in your text.',
      category: { icon: 'i-lucide-text', label: 'Text' },
    },
    {
      icon: 'i-lucide-replace',
      label: 'Text Replace',
      description: 'Find and replace text with plain or regex patterns.',
      category: { icon: 'i-lucide-text', label: 'Text' },
    },
    {
      icon: 'i-lucide-list-ordered',
      label: 'List Sorter / Deduplicator',
      description: 'Sort, deduplicate, and clean lists of text lines instantly.',
      category: { icon: 'i-lucide-text', label: 'Text' },
    },
    {
      icon: 'i-lucide-wrap-text',
      label: 'Text Formatter',
      description: 'Trim, normalize whitespace, and clean up messy text.',
      category: { icon: 'i-lucide-text', label: 'Text' },
    },
    // Color
    {
      icon: 'i-lucide-pipette',
      label: 'Color Picker & Converter',
      description: 'Pick colors and convert between HEX, RGB, HSL, and HSV.',
      category: { icon: 'i-lucide-palette', label: 'Color' },
    },
    {
      icon: 'i-lucide-swatch-book',
      label: 'Color Palette Generator',
      description: 'Generate harmonious color palettes from a base color.',
      category: { icon: 'i-lucide-palette', label: 'Color' },
    },
    {
      icon: 'i-lucide-contrast',
      label: 'Contrast Checker',
      description: 'Check WCAG contrast ratio between foreground and background colors.',
      category: { icon: 'i-lucide-palette', label: 'Color' },
    },
    {
      icon: 'i-lucide-blend',
      label: 'Gradient Generator',
      description: 'Build CSS gradients visually and copy the code.',
      category: { icon: 'i-lucide-palette', label: 'Color' },
    },
    // Network
    {
      icon: 'i-lucide-circle-help',
      label: 'HTTP Status Codes',
      description: 'Look up every HTTP status code with its meaning and usage.',
      category: { icon: 'i-lucide-globe', label: 'Network' },
    },
    {
      icon: 'i-lucide-file-type',
      label: 'MIME Type Lookup',
      description: 'Find the MIME type for any file extension and vice versa.',
      category: { icon: 'i-lucide-globe', label: 'Network' },
    },
    {
      icon: 'i-lucide-waypoints',
      label: 'DNS Lookup',
      description: 'Query DNS records (A, AAAA, MX, TXT, CNAME) for any domain.',
      category: { icon: 'i-lucide-globe', label: 'Network' },
    },
    {
      icon: 'i-lucide-map-pin',
      label: 'IP Info Lookup',
      description: 'Geolocate any IP address and view its ASN and ISP details.',
      category: { icon: 'i-lucide-globe', label: 'Network' },
    },
  ]

  return { tools }
}
