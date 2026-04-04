export {}

declare global {
  interface Window {
    electronAPI?: {
      getAppVersion: () => Promise<string>
      getPlatform: () => Promise<string>
      storeToken: (token: string, expiry?: number) => Promise<boolean>
      getToken: () => Promise<{ token: string; expiry: string | null } | null>
      removeToken: () => Promise<boolean>
      isElectron: true
    }
  }
}
