import { vi } from 'vitest'

export const invoke = vi.fn()

// Default: make invoke throw so tests must explicitly mock
invoke.mockRejectedValue(new Error('Tauri invoke not mocked'))
