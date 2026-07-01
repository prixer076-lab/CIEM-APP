export type ApiResponse<T> = {
  success: boolean;
  message: string;
  path: string;
  timestamp: string;
  data: T;
};
