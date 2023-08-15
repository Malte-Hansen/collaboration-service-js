export const EXAMPLE_EVENT = 'example';

export type ExampleMessage = {
  event: typeof EXAMPLE_EVENT;
  value: number;
};