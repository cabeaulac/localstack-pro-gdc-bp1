import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

// Common code is shared in the xo-shared-iac library
import {commonTags, stackEnv, networkConfig, AccountEntity, AccountConfig, VpcConfig} from '../iac-shared';
import {PulumiUtil, mkItemName} from '../iac-shared';
import {NatGatewayStrategy, SubnetType} from "@pulumi/awsx/types/enums/ec2";

// List of TGW subnet IDs we're creating
// let tgwSubnets: (pulumi.Output<string>)[] = [];
// let tgwAttachment: aws.ec2transitgateway.VpcAttachment | null = null;
// let tgwAttachmentId: pulumi.Output<string> | null = null;
// Import VPC pulumi exports
const config = new pulumi.Config();
const region: aws.Region = config.require("aws_region");
const awsAccountNum = config.require("aws_account");
const accountType = config.require("aws_account_type").toLowerCase();
// let tgwId = config.require("tgw_id");
//
// ********** Setup account
//
// Get the account from the networkConfig interface
let account: AccountEntity | undefined = networkConfig['accounts'].find((item: AccountEntity) => (item.accountNum == awsAccountNum));
console.log("account: ", account);

// Get the primary region this pipeline is running against
let regionConfig = account ? account.regions?.find((item: AccountConfig) => (item.region == region && item.accountType?.toLowerCase() == accountType)) : undefined;
console.log("region: ", regionConfig);

let vpcDef: VpcConfig;
vpcDef = regionConfig?.vpcConfig!;
// Add tags into the VPC config
vpcDef.tags = Object.assign({}, commonTags, {Name: `${regionConfig?.vpcName}-${stackEnv}`});
// vpcDef.numberOfNatGateways = 1;
vpcDef.enableDnsHostnames = true;
// Create isolated subnets. We're using Centralized outbound routing through the Network Service account
vpcDef.subnetSpecs = [
    {type: SubnetType.Private, name: "priv", cidrMask: vpcDef.subnetCidrMask},
    {
        type: SubnetType.Public,
        name: "pub",
        cidrMask: vpcDef.subnetCidrMask
    }];
vpcDef.natGateways = {"strategy": NatGatewayStrategy.Single};
console.log("vpcDef: ", vpcDef);
//
// Create the Main VPC in AWS
export const mainVpc = new awsx.ec2.Vpc(`${regionConfig?.vpcName}-${stackEnv}`,
    vpcDef,
    {provider: PulumiUtil.instance().awsProvider});

export const isolatedSubnetIds = mainVpc.isolatedSubnetIds;
export const privateSubnetIds = mainVpc.privateSubnetIds;
