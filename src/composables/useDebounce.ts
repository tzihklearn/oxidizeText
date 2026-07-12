export function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 500
) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
