import { HttpException } from '@nestjs/common';

type AppHttpExceptionOptions = {
  message: string;
  code: string;
  statusCode: number;
  details?: unknown;
};

export class AppHttpException extends HttpException {
  constructor(private readonly exceptionOptions: AppHttpExceptionOptions) {
    super(
      {
        success: false,
        message: exceptionOptions.message,
        errorCode: exceptionOptions.code,
        details: exceptionOptions.details ?? null,
      },
      exceptionOptions.statusCode,
    );
  }

  getOptions() {
    return this.exceptionOptions;
  }
}
