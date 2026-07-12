import { useMessage } from "naive-ui";

export function useErrorHandler() {
  const message = useMessage();

  const handleError = (error: unknown, context?: string) => {
    const msg = error instanceof Error ? error.message : String(error);
    const fullMsg = context ? `${context}: ${msg}` : msg;
    message.error(fullMsg);
    console.error("[OxidizeText Error]", context, error);
  };

  const handleSuccess = (msg: string) => {
    message.success(msg);
  };

  return { handleError, handleSuccess };
}
