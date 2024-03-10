import { Global, Module } from '@nestjs/common';
import { KConnectEventPatternRegister } from './kconnect-event-pattern-register';
import { DiscoveryModule } from '@golevelup/nestjs-discovery';

@Global()
@Module({
  imports: [DiscoveryModule],
  providers: [KConnectEventPatternRegister],
  exports: [KConnectEventPatternRegister],
})
export class KafkaModule {}
