import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import {mkItemName, stackEnv} from "./common";
import * as util from "../util/pulumi-util";
import {Config, Output} from "@pulumi/pulumi";
import {PulumiUtil} from "../util/pulumi-util";

const config = new pulumi.Config();

// export const defaultVpc: pulumi.Output<aws.ec2.GetVpcResult> = !stackEnv.endsWith("local") ?
//     aws.ec2.getVpcOutput({tags: {Name: config.require('vpc_tag_name')}}, {provider: util.PulumiUtil.instance().awsProvider}) :
//     aws.ec2.getVpcOutput({default: true}, {provider: util.PulumiUtil.instance().awsProvider});

// CloudFront is in us-east-1 and expects the ACM certificate to also be in us-east-1.
// So, we create an east_region provider specifically for these operations.
export const eastRegion = !stackEnv.endsWith("local")
    ? new aws.Provider("east", {
        region: "us-east-1",
        profile: aws.config.profile,
    })
    : util.PulumiUtil.instance().awsProvider;

// used to create alias to cf distribution in Route53 us-east-1
export const cloudfrontZoneId = "Z2FDTNDATAQYW2"; // well known zone id for cf

export const hostedZoneName = config.require("hosted_zone_name");
export const hostedZoneId = config.require("hosted_zone_id");
export const siteHostName = config.require("site_host_name");
let siteName = `${siteHostName}.${hostedZoneName}`;
// In prod the cloudfront distro is the zone name
if (siteHostName == "") {
    siteName = hostedZoneName;
}
export const siteDomainName = siteName;
export const apiName = "lsgdc";
let stage = `${apiName}-${PulumiUtil.instance().env}`;
export const apiStage = stage;
export const apiVersion = config.require("api_version");


console.log("siteDomainName: ", siteDomainName);