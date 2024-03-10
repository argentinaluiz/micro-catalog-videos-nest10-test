import { Controller, Inject, Logger, ValidationPipe } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { DeleteGenreUseCase } from '../../core/genre/application/use-cases/delete-genre/delete-genre.use-case';
import { CDCPayloadDto } from '../kafka-module/cdc.dto';
import { SaveGenreUseCase } from '../../core/genre/application/use-cases/save-genre/save-genre.use-case';
import { SaveGenreInput } from '../../core/genre/application/use-cases/save-genre/save-genre.input';
import { KConnectEventPattern } from '../kafka-module/kconnect-event-pattern.decorator';
import { GenreSavedConsumerDto } from './genre-saved-consumer.dto';

@Controller()
export class GenresConsumer {
  @Inject(SaveGenreUseCase)
  private saveUseCase: SaveGenreUseCase;

  @Inject(DeleteGenreUseCase)
  private deleteUseCase: DeleteGenreUseCase;

  private readonly logger = new Logger(GenresConsumer.name);

  @EventPattern('genres_aggregate')
  async handleCreateAndUpdateEvents(
    @Payload(new ValidationPipe()) message: GenreSavedConsumerDto,
    //@Payload() message: SchemaPayloadDto,
    //@Ctx() context: KafkaContext,
  ) {
    switch (message.op) {
      case 'c':
      case 'u':
        await this.saveUseCase.execute(new SaveGenreInput(message));
        break;
    }
  }

  @KConnectEventPattern('genres')
  async handleKConnectEvents(
    @Payload(new ValidationPipe()) message: CDCPayloadDto,
  ) {
    switch (message.op) {
      case 'r':
        this.logger.log('[INFO] [GenresConsumer] - Discarding read event');
        break;
      case 'c':
        this.logger.log('[INFO] [GenresConsumer] - Discarding create event');
        break;
      case 'u':
        this.logger.log('[INFO] [GenresConsumer] - Discarding update event');
        break;
      case 'd':
        await this.deleteUseCase.execute(message.before.id);
        break;
    }
  }
}
