import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { SaveGenreInput } from '../../core/genre/application/use-cases/save-genre/save-genre.input';

export class GenreSavedConsumerDto extends SaveGenreInput {
  @IsIn(['c', 'u'])
  @IsString()
  @IsNotEmpty()
  op: 'c' | 'u';
}
