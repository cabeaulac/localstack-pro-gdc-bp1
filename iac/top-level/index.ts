// require('module-alias/register'); // needed for custom aliases
import {PulumiUtil} from "../iac-shared";
// Initialize PulumiUtil Singleton
const pulumiUtil = PulumiUtil.instance();

export * from "./cflogsBucket";
export * from './vpc';
export * from './account';
export * from './r53';
