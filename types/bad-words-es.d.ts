declare module 'bad-words-es' {
  export default class Filter {
    constructor(options?: { list?: string[]; placeHolder?: string; regex?: RegExp; replaceRegex?: RegExp });
    isProfane(text: string): boolean;
    clean(text: string): string;
    addWords(...words: string[]): void;
    removeWords(...words: string[]): void;
  }
}
