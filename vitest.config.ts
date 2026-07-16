import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./app/javascript/builder/__tests__/setup.ts"],
  },
})
