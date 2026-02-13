declare module 'html2canvas' {
  interface Options {
    backgroundColor?: string;
    scale?: number;
    useCORS?: boolean;
    logging?: boolean;
  }
  
  function html2canvas(element: HTMLElement, options?: Options): Promise<HTMLCanvasElement>;
  export default html2canvas;
} 