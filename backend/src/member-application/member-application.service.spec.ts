import { Test, TestingModule } from '@nestjs/testing';
import { MemberApplicationService } from './member-application.service';

describe('MemberApplicationService', () => {
  let service: MemberApplicationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MemberApplicationService],
    }).compile();

    service = module.get<MemberApplicationService>(MemberApplicationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
