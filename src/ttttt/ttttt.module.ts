import { Module } from '@nestjs/common';
import { TttttService } from './ttttt.service';
import { TttttResolver } from './ttttt.resolver';

@Module({
  providers: [TttttResolver, TttttService],
})
export class TttttModule {}
