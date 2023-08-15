import { Module } from '@nestjs/common';
import { ExampleModule } from './example/example.module';
import { ModelService } from './model.service';

@Module({
  imports: [ExampleModule],
  providers: [ModelService],
  exports: [ModelService]
})
export class ModelModule {}
