import { Test, TestingModule } from '@nestjs/testing';
import { UserModifierFactoryService } from './user-modifier-factory.service';

describe('UserModifierFactoryService', () => {
  let service: UserModifierFactoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserModifierFactoryService],
    }).compile();

    service = module.get<UserModifierFactoryService>(UserModifierFactoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
