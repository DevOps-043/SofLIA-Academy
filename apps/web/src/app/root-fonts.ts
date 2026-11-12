import localFont from 'next/font/local'

// Las familias del diseño se empaquetan para compilar sin descargas externas.
export const newsreader = localFont({
  src: [
    { path: './fonts/newsreader-roman.ttf', weight: '300 400', style: 'normal' },
    { path: './fonts/newsreader-italic.ttf', weight: '300 400', style: 'italic' },
  ],
  variable: '--font-newsreader',
  display: 'swap',
})

export const interTight = localFont({
  src: './fonts/inter-tight.ttf',
  weight: '400 700',
  style: 'normal',
  variable: '--font-inter-tight',
  display: 'swap',
})

export const ibmPlexSans = localFont({
  src: './fonts/ibm-plex-sans.ttf',
  weight: '400 600',
  style: 'normal',
  variable: '--font-ibm-plex',
  display: 'swap',
})
