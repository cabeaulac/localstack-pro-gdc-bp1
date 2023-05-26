import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

// Common code is shared in the xo-shared-iac library
import {
    hostedZoneName,
    mkTagsWithName
} from '../iac-shared';
import {PulumiUtil, mkItemName} from '../iac-shared';

export const lsgdcPhz = new aws.route53.Zone(mkItemName('hz'), {
    name: hostedZoneName,
    tags: mkTagsWithName('hz')
}, {provider: PulumiUtil.instance().awsProvider});
