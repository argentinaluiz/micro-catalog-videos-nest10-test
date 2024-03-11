import { Controller, Inject, Logger, ValidationPipe } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import { DeleteCastMemberUseCase } from '../../core/cast-member/application/use-cases/delete-cast-member/delete-cast-member.use-case';
import { CDCPayloadDto } from '../kafka-module/cdc.dto';
import { SaveCastMemberUseCase } from '../../core/cast-member/application/use-cases/save-cast-member/save-cast-member.use-case';
import { SaveCastMemberInput } from '../../core/cast-member/application/use-cases/save-cast-member/save-cast-member.input';
import { KConnectEventPattern } from '../kafka-module/kconnect-event-pattern.decorator';

@Controller()
export class CastMembersConsumer {
  @Inject(SaveCastMemberUseCase)
  private saveUseCase: SaveCastMemberUseCase;

  @Inject(DeleteCastMemberUseCase)
  private deleteUseCase: DeleteCastMemberUseCase;

  private readonly logger = new Logger(CastMembersConsumer.name);

  @KConnectEventPattern('cast_members')
  async handle(
    @Payload(new ValidationPipe()) message: CDCPayloadDto,
    //@Ctx() context: KafkaContext,
  ) {
    switch (message.op) {
      case 'r':
        this.logger.log('[INFO] [CastMembersConsumer] - Discarding read event');
        break;
      case 'c':
      case 'u':
        const inputBeforeValidate = {
          cast_member_id: message.after?.id,
          name: message.after?.name,
          type: message.after?.type,
          created_at: message.after?.created_at,
        };
        const input = await new ValidationPipe({
          errorHttpStatusCode: 422,
          transform: true,
        }).transform(inputBeforeValidate, {
          type: 'body',
          metatype: SaveCastMemberInput,
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
}
