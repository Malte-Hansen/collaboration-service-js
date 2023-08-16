import { Test, TestingModule } from '@nestjs/testing';
import { RoomFactoryService } from './room-factory.service';

describe('RoomFactoryService', () => {
  let service: RoomFactoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoomFactoryService],
    }).compile();

    service = module.get<RoomFactoryService>(RoomFactoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
