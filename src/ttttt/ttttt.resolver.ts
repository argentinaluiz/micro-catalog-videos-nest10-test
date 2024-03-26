import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { TttttService } from './ttttt.service';
import { Ttttt } from './entities/ttttt.entity';
import { CreateTttttInput } from './dto/create-ttttt.input';
import { UpdateTttttInput } from './dto/update-ttttt.input';

@Resolver(() => Ttttt)
export class TttttResolver {
  constructor(private readonly tttttService: TttttService) {}

  @Mutation(() => Ttttt)
  createTtttt(@Args('createTttttInput') createTttttInput: CreateTttttInput) {
    return this.tttttService.create(createTttttInput);
  }

  @Query(() => [Ttttt], { name: 'ttttt' })
  findAll() {
    return this.tttttService.findAll();
  }

  @Query(() => Ttttt, { name: 'ttttt' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.tttttService.findOne(id);
  }

  @Mutation(() => Ttttt)
  updateTtttt(@Args('updateTttttInput') updateTttttInput: UpdateTttttInput) {
    return this.tttttService.update(updateTttttInput.id, updateTttttInput);
  }

  @Mutation(() => Ttttt)
  removeTtttt(@Args('id', { type: () => Int }) id: number) {
    return this.tttttService.remove(id);
  }
}
