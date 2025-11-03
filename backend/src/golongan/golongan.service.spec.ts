import { Test, TestingModule } from '@nestjs/testing';
import { GolonganService } from './golongan.service';

describe('GolonganService', () => {
  let service: GolonganService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GolonganService],
    }).compile();

    service = module.get<GolonganService>(GolonganService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
