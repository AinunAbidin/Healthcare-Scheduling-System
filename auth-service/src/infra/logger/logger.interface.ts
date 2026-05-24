export abstract class ILoggerService {
  abstract log(message: string): void;
  abstract warn(message: string): void;
  abstract error(message: string): void;
}
