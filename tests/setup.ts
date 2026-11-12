// Polyfill fetch and crypto in jsdom test environment
if (typeof global.fetch === 'undefined') {
  if (typeof globalThis.fetch !== 'undefined') {
    global.fetch = globalThis.fetch;
  } else {
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(''),
      })
    ) as any;
  }
}

if (typeof window !== 'undefined' && typeof window.fetch === 'undefined') {
  window.fetch = global.fetch;
}
