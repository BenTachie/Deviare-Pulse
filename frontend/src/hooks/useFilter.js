import { useMemo } from 'react'

/**
 * Generic filter hook.
 * @param {Array}    data       - The full data array
 * @param {Function} filterFn   - Called with (item, filters) — return true to include
 * @param {Object}   filters    - Current filter state
 * @returns {Array} filtered
 */
export function useFilter(data, filterFn, filters) {
  return useMemo(
    () => data.filter((item) => filterFn(item, filters)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, ...Object.values(filters)]
  )
}