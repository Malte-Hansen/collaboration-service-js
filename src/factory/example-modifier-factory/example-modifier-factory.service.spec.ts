import { Test, TestingModule } from '@nestjs/testing';
import { ExampleModifierFactoryService } from './example-modifier-factory.service';

describe('ExampleModifierFactoryService', () => {
  let service: ExampleModifierFactoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExampleModifierFactoryService],
    }).compile();

    service = module.get<ExampleModifierFactoryService>(ExampleModifierFactoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
