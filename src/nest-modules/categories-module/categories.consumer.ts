import { Controller, Inject, ValidationPipe } from '@nestjs/common';
import {
  Ctx,
  EventPattern,
  KafkaContext,
  Payload,
} from '@nestjs/microservices';
import { DeleteCategoryUseCase } from '../../core/category/application/use-cases/delete-category/delete-category.use-case';
import { SchemaPayloadDto } from './SchemaChangesDto';
import { SaveCategoryUseCase } from '../../core/category/application/use-cases/save-category/save-category.use-case';

@Controller()
export class CategoriesConsumer {
  @Inject(SaveCategoryUseCase)
  private saveUseCase: SaveCategoryUseCase;

  @Inject(DeleteCategoryUseCase)
  private deleteUseCase: DeleteCategoryUseCase;

  @EventPattern('categories')
  async handle(
    @Payload(new ValidationPipe()) message: SchemaPayloadDto,
    @Ctx() context: KafkaContext,
  ) {
    switch (message.op) {
      case 'c':
      case 'r':
      case 'u':
        await this.saveUseCase.execute(message.after);
      case 'd':
        await this.deleteUseCase.execute(message.before.id);
    }

    const { offset } = context.getMessage();
    const partition = context.getPartition();
    const topic = context.getTopic();
    await context.getConsumer().commitOffsets([{ topic, partition, offset }]);
  }
}
