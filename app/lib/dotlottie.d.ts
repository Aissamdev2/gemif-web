declare module "@lottiefiles/dotlottie-web" {
  export class DotLottiePlayer extends HTMLElement {
    play(): void;
    pause(): void;
    stop(): void;
    setSpeed(speed: number): void;
    setLoop(loop: boolean): void;
    setAutoplay(autoplay: boolean): void;
    load(src: string): Promise<void>;
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "dotlottie-player": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        background?: string;
        speed?: number;
        loop?: boolean;
        autoplay?: boolean;
      };
    }
  }
}

export {};