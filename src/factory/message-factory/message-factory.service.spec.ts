import { Test, TestingModule } from '@nestjs/testing';
import { MessageFactoryService } from './message-factory.service';

describe('MessageFactoryService', () => {
  let service: MessageFactoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MessageFactoryService],
    }).compile();

    service = module.get<MessageFactoryService>(MessageFactoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
