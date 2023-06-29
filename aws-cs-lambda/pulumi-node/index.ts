// require('module-alias/register'); // needed for custom aliases
import {PulumiUtil} from "../../iac/iac-shared";
// Initialize PulumiUtil Singleton
const pulumiUtil = PulumiUtil.instance();

export * from './lambda';
