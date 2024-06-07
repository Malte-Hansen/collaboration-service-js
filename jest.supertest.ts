import sharedConfig from './jest.config';
import type { Config } from 'jest';

const superTestConfig: Config = {
  ...sharedConfig,
  moduleFileExtensions: ['js', 'json', 'ts'],
  testRegex: '.supertest-spec.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
};

export default superTestConfig;
