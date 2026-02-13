declare module 'marked' {
  interface MarkedOptions {
    gfm?: boolean;
    breaks?: boolean;
    pedantic?: boolean;
    sanitize?: boolean;
    smartLists?: boolean;
    smartypants?: boolean;
  }

  export function marked(src: string, options?: MarkedOptions): string;
} 