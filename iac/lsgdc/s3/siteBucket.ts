import {interpolate} from "@pulumi/pulumi";
import {Bucket, BucketPublicAccessBlock} from "@pulumi/aws/s3";
import {mkItemName, mkTagsWithName, PulumiUtil} from "../../iac-shared";

export const siteBucket = new Bucket(
    mkItemName("site-bucket"),
    {
        bucket: interpolate`${mkItemName("site")}-${PulumiUtil.instance().region}`,
        forceDestroy: PulumiUtil.instance().isLocal,
        versioning: {
            enabled: false,
        },
        acl: "private", // bucket is private

        //                lifecycleRules: lifeCycleRules,
        // allow browser upload with signed url
        corsRules: [
            {
                allowedHeaders: ["*"],
                allowedMethods: ["PUT", "POST"],
                allowedOrigins: ["http://localhost:3030"],
                exposeHeaders: ["ETag"],
                maxAgeSeconds: 3000,
            },
        ],
        tags: mkTagsWithName("site"),
    },
    {provider: PulumiUtil.instance().awsProvider}
);

// block all public access to bucket
export const siteBucketBlockPublicAccess = new BucketPublicAccessBlock(
    mkItemName("site-public-access-block"),
    {
        bucket: siteBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
    },
    {provider: PulumiUtil.instance().awsProvider}
);
