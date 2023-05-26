import {interpolate} from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import {
    mkItemName,
    mkTagsWithName,
    PulumiUtil,
    siteDomainName,
} from "../../iac-shared";


const userBucketKey = new aws.kms.Key(mkItemName("user-bucket-key"), {
        description: "This key is used to encrypt bucket objects",
        deletionWindowInDays: 10,
        tags: mkTagsWithName("user-bucket-key"),
    },
    {provider: PulumiUtil.instance().awsProvider});

export const userBucket = new aws.s3.Bucket(
    mkItemName("user-bucket"),
    {
        bucket: interpolate`${mkItemName("user")}-${PulumiUtil.instance().region}`,
        corsRules: [
            {
                allowedHeaders: ["*"],
                allowedMethods: ["HEAD", "POST", "PUT", "GET"],
                allowedOrigins: [
                    `https://${siteDomainName}/`,
                    `https://${siteDomainName}`,
                    "http://localhost:3030",
                    "http://localhost:3040",
                    "*",
                ],
            },
        ],
        // serverSideEncryptionConfiguration: {
        //     rule: {
        //         applyServerSideEncryptionByDefault: {
        //             kmsMasterKeyId: cuspUserBucketKey.arn,
        //             sseAlgorithm: "aws:kms",
        //         },
        //     }
        // },
        tags: mkTagsWithName("cusp-user"),
        forceDestroy: PulumiUtil.instance().isLocal,

    },
    {provider: PulumiUtil.instance().awsProvider}
);
