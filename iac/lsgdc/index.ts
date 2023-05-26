import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import {interpolate, Output} from "@pulumi/pulumi";
import {stackEnv} from "../iac-shared";
import {BucketV2} from "@pulumi/aws/s3";

export const toplevelStackRef = new pulumi.StackReference(`toplevel.${stackEnv}`);
export const dbStackRef = new pulumi.StackReference(`db.${stackEnv}`);
export const userTableName = dbStackRef.requireOutput('userTableName');
export const userTable = dbStackRef.requireOutput('userTable') as pulumi.Output<aws.dynamodb.Table>;
export const cflogBucket = toplevelStackRef.requireOutput('cflogBucket') as pulumi.Output<BucketV2>;

export * from "./iam";
export * from "./dynamodb";
export * from "./lambda-shared";
export * from "./s3";
export * from "./apigw";
export * from "./cloudfront";
export {apiStage, apiVersion} from "../iac-shared";
export * from "./lambda/userDdbStreamHandler";
//
import {cloudfrontZoneId, mkItemName, siteDomainName, PulumiUtil, apiStage} from "../iac-shared";
import {CloudfrontInvalidationResource} from "./common/cloudfront-invalidation-provider";
import {userCfDistribution} from "./cloudfront";
import {siteBucket, uiBuildRes} from "./s3";
import {restApiId, wsApiEndpoint} from "./apigw";
import {hostedZoneId} from "../iac-shared";
//
//
// Needed by `run-ui` make task
let restApiEndpoint: Output<string>;
let websocketApiEndpoint: Output<string>;
// Create alias record to point to cf distro
let cfHostedRecord: Output<string> = pulumi.interpolate`hst.cloudfront.net`;
let cfDomain: Output<string> = pulumi.interpolate`none`;
let cfInvalidator: CloudfrontInvalidationResource | undefined;

if (!PulumiUtil.instance().isLocal) {
    restApiEndpoint = Output.create(`https://${siteDomainName}/api`);
    websocketApiEndpoint = Output.create(`wss://${siteDomainName}/ws/`);

    if (PulumiUtil.instance().isActive("use-route53") && userCfDistribution) {
        cfDomain = userCfDistribution.domainName;
        const cfRoute53Record = new aws.route53.Record(
            mkItemName("cfHostRecord"),
            {
                zoneId: hostedZoneId,
                name: siteDomainName,
                type: "A",
                aliases: [
                    {
                        evaluateTargetHealth: false,
                        zoneId: cloudfrontZoneId,
                        name: cfDomain,
                    },
                ],
            },
            {
                dependsOn: [userCfDistribution],
                provider: PulumiUtil.instance().awsProvider,
            }
        );

        cfHostedRecord = cfRoute53Record.fqdn;
    }

    // detect changes in s3 frontend bucket and invalidates cache if anything changes
    if (userCfDistribution) {
        cfInvalidator = new CloudfrontInvalidationResource(
            mkItemName("cfInvalidator"),
            {
                cfDistributionId: userCfDistribution.id,
                invalidationPaths: ["/*"],
                buildHash: uiBuildRes!.hash,
            },
            {
                dependsOn: [userCfDistribution],
            }
        );
    }
} else {
    restApiEndpoint = interpolate`${PulumiUtil.instance().host}/restapis/${restApiId}/${apiStage}/_user_request_`;
    websocketApiEndpoint = wsApiEndpoint;
}

export const cfWebInvalidator = cfInvalidator;
export const cfFqdn = cfHostedRecord;
export const siteBucketName = siteBucket.bucket;

export const userRestApiEndpoint = restApiEndpoint;
export const userWebsocketApiEndpoint = websocketApiEndpoint;
export const userCloudfrontDomain = cfDomain;
