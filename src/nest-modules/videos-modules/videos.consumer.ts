import { Controller, Inject, Logger, ValidationPipe } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { DeleteVideoUseCase } from '../../core/video/application/use-cases/delete-video/delete-video.use-case';
import { CDCPayloadDto } from '../kafka-module/cdc.dto';
import { SaveVideoUseCase } from '../../core/video/application/use-cases/save-video/save-video.use-case';
import { SaveVideoInput } from '../../core/video/application/use-cases/save-video/save-video.input';
import { KConnectEventPattern } from '../kafka-module/kconnect-event-pattern.decorator';
import { VideoSavedConsumerDto } from './video-saved-consumer.dto';

@Controller()
export class VideosConsumer {
  @Inject(SaveVideoUseCase)
  private saveUseCase: SaveVideoUseCase;

  @Inject(DeleteVideoUseCase)
  private deleteUseCase: DeleteVideoUseCase;

  private readonly logger = new Logger(VideosConsumer.name);

  @EventPattern('videos_aggregate')
  async handleCreateAndUpdateEvents(
    @Payload(new ValidationPipe()) message: VideoSavedConsumerDto,
    //@Payload() message: SchemaPayloadDto,
    //@Ctx() context: KafkaContext,
  ) {
    switch (message.op) {
      case 'c':
      case 'u':
        await this.saveUseCase.execute(new SaveVideoInput(message));
        break;
    }
  }

  @KConnectEventPattern('videos')
  async handleKConnectEvents(
    @Payload(new ValidationPipe()) message: CDCPayloadDto,
  ) {
    switch (message.op) {
      case 'r':
        this.logger.log('[INFO] [VideosConsumer] - Discarding read event');
        break;
      case 'c':
        this.logger.log('[INFO] [VideosConsumer] - Discarding create event');
        break;
      case 'u':
        this.logger.log('[INFO] [VideosConsumer] - Discarding update event');
        break;
      case 'd':
        await this.deleteUseCase.execute(message.before.id);
        break;
    }
  }
}
