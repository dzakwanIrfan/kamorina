import { Test, TestingModule } from '@nestjs/testing';
import { MemberApplicationController } from './member-application.controller';

describe('MemberApplicationController', () => {
  let controller: MemberApplicationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MemberApplicationController],
    }).compile();

    controller = module.get<MemberApplicationController>(MemberApplicationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
