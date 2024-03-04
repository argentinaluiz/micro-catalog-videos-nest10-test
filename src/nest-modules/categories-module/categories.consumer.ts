import { Controller, Inject, Logger, ValidationPipe } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import { DeleteCategoryUseCase } from '../../core/category/application/use-cases/delete-category/delete-category.use-case';
import { CDCPayloadDto } from './SchemaChangesDto';
import { SaveCategoryUseCase } from '../../core/category/application/use-cases/save-category/save-category.use-case';
import { SaveCategoryInput } from '../../core/category/application/use-cases/save-category/save-category.input';
import { KConnectEventPattern } from '../kafka-module/kconnect-event-pattern.decorator';

@Controller()
export class CategoriesConsumer {
  @Inject(SaveCategoryUseCase)
  private saveUseCase: SaveCategoryUseCase;

  @Inject(DeleteCategoryUseCase)
  private deleteUseCase: DeleteCategoryUseCase;

  private readonly logger = new Logger(CategoriesConsumer.name);

  @KConnectEventPattern('categories')
  async handle(
    @Payload(new ValidationPipe()) message: CDCPayloadDto,
    //@Payload() message: SchemaPayloadDto,
    //@Ctx() context: KafkaContext,
  ) {
    console.log(message);
    switch (message.op) {
      case 'r':
        this.logger.log('[INFO] [CategoriesConsumer] - Discarding read event');
        break;
      case 'c':
      case 'u':
        const inputBeforeValidate = {
          category_id: message.after?.id,
          name: message.after?.name,
          description: message.after?.description,
          is_active: message.after?.is_active,
          created_at: message.after?.created_at,
        };
        const input = await new ValidationPipe({
          errorHttpStatusCode: 422,
          transform: true,
        }).transform(inputBeforeValidate, {
          type: 'body',
          metatype: SaveCategoryInput,
        });
        await this.saveUseCase.execute(input);
        break;
      case 'd':
        await this.deleteUseCase.execute(message.before.id);
        break;
    }

    // const { offset } = context.getMessage();
    // const partition = context.getPartition();
    // const topic = context.getTopic();
    // await context.getConsumer().commitOffsets([{ topic, partition, offset }]);
  }

  // @EventPattern('mysql.micro_videos.categories')
  // handle2(@Payload() message: any) {
  //   console.log(message);
  // }
}
