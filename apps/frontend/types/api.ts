export interface ApiResponse<T> {
  timestamp: Date;
  message: string;
  data: T;
  success: boolean;
}
