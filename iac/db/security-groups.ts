import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import {commonTags, mkItemName, PulumiUtil, stackEnv} from "../iac-shared";
import {toplevelStackRef} from "./index";

const isolatedSubnetIds: pulumi.Output<[string]> = toplevelStackRef.requireOutput('isolatedSubnetIds') as pulumi.Output<[string]>;
const mainVpc = toplevelStackRef.requireOutput('mainVpc') as pulumi.Output<awsx.ec2.Vpc>;
// Get the VPC ID for one of the subnets
const config = new pulumi.Config();
let region: aws.Region = config.require("aws_region");

//
// The RDS Global pipeline is setup in two regions. Security groups must be created in both region/VPCs.
//

//
// PRIMARY Region
//
// Security Group - Shared Service RDS. RDS cluster uses this group
export const hstPrimaryRdsSg = new aws.ec2.SecurityGroup(mkItemName(`rds-primary-svr-sg`), {
    vpcId: mainVpc.vpcId,
    tags: Object.assign({}, commonTags, {Name: mkItemName(`rds-primary-svr-sg`)}),
}, {provider: PulumiUtil.instance().awsProvider});

// Security Group - Shared Service RDS Client. Resources have to use this SG to access Shared Svcs RDS
export const hstPrimaryRdsClientSg = new aws.ec2.SecurityGroup(
    mkItemName(`primary-client-sg`),
    {
        vpcId: mainVpc.vpcId,
        tags: Object.assign({}, commonTags, {Name: mkItemName(`primary-client-sg`)}),
    }, {provider: PulumiUtil.instance().awsProvider}
);

// Security group rule - ingress from all internal networks
export const hstPrimaryRdsIngressNwRule = new aws.ec2.SecurityGroupRule(
    mkItemName(`primary-ingress-sg-rule-internal-networks`),
    {
        type: "ingress",
        fromPort: 5432,
        toPort: 5432,
        protocol: "tcp",
        cidrBlocks: ["10.0.0.0/8"],
        securityGroupId: hstPrimaryRdsSg.id,
    }, {provider: PulumiUtil.instance().awsProvider}
);
if (PulumiUtil.instance().isLocal) {
    const hstPrimaryRdsIngress4510Rule = new aws.ec2.SecurityGroupRule(
        mkItemName(`primary-ingress-sg-rule-4510`),
        {
            type: "ingress",
            fromPort: 4510,
            toPort: 4510,
            protocol: "tcp",
            cidrBlocks: ["10.0.0.0/8"],
            securityGroupId: hstPrimaryRdsSg.id,
        }, {provider: PulumiUtil.instance().awsProvider}
    );
}
// Security Group Rule - Ingress to eaSorRds from eaSorRdsClient
export const eaSorPrimaryRdsIngressSgSrcRule = new aws.ec2.SecurityGroupRule(
    mkItemName(`primary-ingress-sg-rule`),
    {
        type: "ingress",
        fromPort: 5432,
        toPort: 5432,
        protocol: "tcp",
        sourceSecurityGroupId: hstPrimaryRdsClientSg.id,
        securityGroupId: hstPrimaryRdsSg.id,
    }, {provider: PulumiUtil.instance().awsProvider}
);

// Security group rule - ingress from all internal networks
export const eaSorPrimaryRdsEgressRule = new aws.ec2.SecurityGroupRule(
    mkItemName(`primary-egress-443-internal-networks`),
    {
        type: "egress",
        fromPort: 443,
        toPort: 443,
        protocol: "tcp",
        cidrBlocks: ["10.0.0.0/8"],
        securityGroupId: hstPrimaryRdsSg.id,
    }, {provider: PulumiUtil.instance().awsProvider}
);


// Security Group Rule - Egress to eaSorRds from eaSorRdsClient
export const eaSorPrimaryRdsClientEgress = new aws.ec2.SecurityGroupRule(
    mkItemName(`primary-egress-sg-rule`),
    {
        type: "egress",
        fromPort: 5432,
        toPort: 5432,
        protocol: "tcp",
        sourceSecurityGroupId: hstPrimaryRdsSg.id,
        securityGroupId: hstPrimaryRdsClientSg.id,
    }, {provider: PulumiUtil.instance().awsProvider}
);


//
// REPLICA Region
//
//
// // Security Group - Shared Service RDS. RDS cluster uses this group
// export const eaSorReplicaRdsSg = new aws.ec2.SecurityGroup(mkItemName(`rds-replica-svr-sg`), {
//     vpcId: vpcReplicaId,
//     tags: Object.assign({}, commonTags, {Name: mkItemName(`rds-replica-svr-sg`)}),
// }, {provider: PulumiUtil.east1Provider});
//
// // Security Group - Shared Service RDS Client. Resources have to use this SG to access Shared Svcs RDS
// export const eaSorReplicaRdsClientSg = new aws.ec2.SecurityGroup(
//     mkItemName("sor-rds-replica-client-sg"),
//     {
//         vpcId: vpcReplicaId,
//         tags: Object.assign({}, commonTags, {Name: mkItemName("sor-rds-replica-client-sg")}),
//     }, {provider: PulumiUtil.east1Provider}
// );
//
// // Security group rule - ingress from all internal networks
// export const eaSorReplicaRdsIngressNwRule = new aws.ec2.SecurityGroupRule(
//     mkItemName(`replica-ingress-sg-rule-internal-networks`),
//     {
//         type: "ingress",
//         fromPort: 5432,
//         toPort: 5432,
//         protocol: "tcp",
//         cidrBlocks: ["10.0.0.0/8"],
//         securityGroupId: eaSorReplicaRdsSg.id,
//     }, {provider: PulumiUtil.east1Provider}
// );
//
// // Security group rule - ingress from all internal networks
// export const eaSorReplicaPrimaryRdsEgressRule = new aws.ec2.SecurityGroupRule(
//     mkItemName(`replica-egress-443-internal-networks`),
//     {
//         type: "egress",
//         fromPort: 443,
//         toPort: 443,
//         protocol: "tcp",
//         cidrBlocks: ["10.0.0.0/8"],
//         securityGroupId: eaSorReplicaRdsSg.id,
//     }, {provider: PulumiUtil.east1Provider}
// );
//
// // Security Group Rule - Ingress to eaSorRds from eaSorRdsClient
// export const eaSorReplicaRdsIngressSgSrcRule = new aws.ec2.SecurityGroupRule(
//     mkItemName(`replica-ingress-sg-rule`),
//     {
//         type: "ingress",
//         fromPort: 5432,
//         toPort: 5432,
//         protocol: "tcp",
//         sourceSecurityGroupId: eaSorReplicaRdsClientSg.id,
//         securityGroupId: eaSorReplicaRdsSg.id,
//     }, {provider: PulumiUtil.east1Provider}
// );
//
// // Security Group Rule - Egress to eaSorRds from eaSorRdsClient
// export const eaSorReplicaRdsClientEgress = new aws.ec2.SecurityGroupRule(
//     mkItemName(`replica-egress-sg-rule`),
//     {
//         type: "egress",
//         fromPort: 5432,
//         toPort: 5432,
//         protocol: "tcp",
//         sourceSecurityGroupId: eaSorReplicaRdsSg.id,
//         securityGroupId: eaSorReplicaRdsClientSg.id,
//     }, {provider: PulumiUtil.east1Provider}
// );

// Export SG IDs for use in other pipelines
export const hstPrimaryRdsSgId = hstPrimaryRdsSg.id;
export const hstPrimaryRdsClientSgId = hstPrimaryRdsClientSg.id;
// export const eaSorReplicaRdsSgId = eaSorReplicaRdsSg.id;
// export const eaSorReplicaRdsClientSgId = eaSorReplicaRdsClientSg.id;
