import { Module } from '@nestjs/common';
import { VIDEO_PROVIDERS } from './videos.providers';
import { VideosConsumer } from './videos.consumer';
import { CategoriesModule } from '../categories-module/categories.module';
import { GenresModule } from '../genres-module/genres.module';
import { CastMembersModule } from '../cast-members-module/cast-members.module';
@Module({
  imports: [
    CategoriesModule.forFeature(),
    GenresModule.forFeature(),
    CastMembersModule.forFeature(),
  ],
  controllers: [VideosConsumer],
  providers: [
    ...Object.values(VIDEO_PROVIDERS.REPOSITORIES),
    ...Object.values(VIDEO_PROVIDERS.USE_CASES),
  ],
  exports: [VIDEO_PROVIDERS.REPOSITORIES.VIDEO_REPOSITORY.provide],
})
export class VideosModule {}
