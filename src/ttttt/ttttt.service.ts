import { Injectable } from '@nestjs/common';
import { CreateTttttInput } from './dto/create-ttttt.input';
import { UpdateTttttInput } from './dto/update-ttttt.input';
import { Ttttt } from './entities/ttttt.entity';

@Injectable()
export class TttttService {
  create(createTttttInput: CreateTttttInput) {
    return 'This action adds a new ttttt';
  }

  findAll() {
    const entity = new Ttttt();
    entity.exampleField = 1;
    return [entity];
  }

  findOne(id: number) {
    return `This action returns a #${id} ttttt`;
  }

  update(id: number, updateTttttInput: UpdateTttttInput) {
    return `This action updates a #${id} ttttt`;
  }

  remove(id: number) {
    return `This action removes a #${id} ttttt`;
  }
}
