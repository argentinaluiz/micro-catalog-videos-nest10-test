import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { SaveVideoInput } from '../../core/video/application/use-cases/save-video/save-video.input';

export class VideoSavedConsumerDto extends SaveVideoInput {
  @IsIn(['c', 'u'])
  @IsString()
  @IsNotEmpty()
  op: 'c' | 'u';
}
