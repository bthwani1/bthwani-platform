import * as incentivesDefinition from '../../../../registry/dsh_incentives.json';
import { DshIncentivesConfig } from '../types/incentives.types';

export const dshIncentivesConfig = incentivesDefinition as DshIncentivesConfig;

export type { DshIncentivesConfig };
