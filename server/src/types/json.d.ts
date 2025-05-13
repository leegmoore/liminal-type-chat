// Type declarations for JSON imports
declare module '*.json' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const value: any; // Using any is necessary for generic JSON module declaration
  export default value;
}
