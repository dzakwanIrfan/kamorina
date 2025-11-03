import { Test, TestingModule } from '@nestjs/testing';
import { GolonganController } from './golongan.controller';

describe('GolonganController', () => {
  let controller: GolonganController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GolonganController],
    }).compile();

    controller = module.get<GolonganController>(GolonganController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
