export interface IUseCase<Input, Output> {
  execute(input: Input): Output | Promise<Output>;
}
