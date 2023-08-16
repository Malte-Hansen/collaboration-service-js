import { Test, TestingModule } from '@nestjs/testing';
import { IdGenerationService } from './id-generation.service';

describe('IdGenerationService', () => {
  let service: IdGenerationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IdGenerationService],
    }).compile();

    service = module.get<IdGenerationService>(IdGenerationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
