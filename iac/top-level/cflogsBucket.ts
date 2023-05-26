import * as aws from '@pulumi/aws';
import {BucketV2} from "@pulumi/aws/s3";
import {mkItemName, mkTagsWithName, PulumiUtil} from "../iac-shared";

export const cflogBucket = new BucketV2(mkItemName("cflogs"),
    {
        // acl: "log-delivery-write",
        tags: mkTagsWithName("site")
    },
    {provider: PulumiUtil.instance().awsProvider});

const exampleBucketOwnershipControls = new aws.s3.BucketOwnershipControls(mkItemName("cflogbucket-ownership"), {
        bucket: cflogBucket.id,
        rule: {
            objectOwnership: "BucketOwnerPreferred",
        },
    },
    {provider: PulumiUtil.instance().awsProvider});

const cflogsBucketVersioning = new aws.s3.BucketVersioningV2(mkItemName("cf-logs-versioning"), {
        bucket: cflogBucket.id,
        versioningConfiguration: {
            status: "Disabled",
        },
    },
    {provider: PulumiUtil.instance().awsProvider});

const cflogBucketTarget = new aws.s3.BucketAclV2(mkItemName("logBucketAcl"), {
        bucket: cflogBucket.id,
        acl: "log-delivery-write",
    },
    {
        dependsOn: [exampleBucketOwnershipControls],
        provider: PulumiUtil.instance().awsProvider
    });
