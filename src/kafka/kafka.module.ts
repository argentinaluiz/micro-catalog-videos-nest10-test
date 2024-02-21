import { Module, OnModuleInit } from '@nestjs/common';

@Module({})
export class KafkaModule implements OnModuleInit {

    //get application instance
    onModuleInit() {
        console.log('KafkaModule.onModuleInit');
    }
}
