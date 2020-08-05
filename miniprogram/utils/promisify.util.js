export function promisify (wxFunction, params) {
  return new Promise((resolve, reject) => {
    wxFunction({
      ...params,
      success: resolve,
      fail: reject
    })
  })
}
