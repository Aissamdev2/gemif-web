
export type FunctionMetadata = {
  scope?: string,
  operation?: string,
  isExpected?: boolean,
  isSensible?: boolean,
}



export type ProgressCallback = (key: string, percent: number) => void;

