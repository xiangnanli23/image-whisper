declare module '@ai4a11y/toolkit/adapter-mcp' {
 export function defineDescriptor(fields: Record<string, unknown>): Record<string, unknown>;
 export function createAdapterProvider(options: Record<string, unknown>): {ready:Promise<void>;[key:string]:unknown};
 export function fromToggleAdapter(options: Record<string, unknown>): unknown;
 export function detectBrowserPlatform(): Record<string,string>;
 export function connectToToolkit(options: Record<string, unknown>): {ready:Promise<unknown>;close():Promise<void>;providerId:string;status:{state:string}};
}
