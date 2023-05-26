import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import {PulumiUtil, stackEnv, mkTagsWithName} from "../iac-shared";
import {Ami} from "@pulumi/aws/ec2";

const toplevelStackRef = new pulumi.StackReference(`toplevel.${stackEnv}`);
const privateSubnetIds: pulumi.Output<[string]> = toplevelStackRef.requireOutput('privateSubnetIds') as pulumi.Output<[string]>;
const mainVpc = toplevelStackRef.requireOutput('mainVpc') as pulumi.Output<awsx.ec2.Vpc>;

const dbStackRef = new pulumi.StackReference(`db.${stackEnv}`);
const dbClientSg: pulumi.Output<aws.ec2.SecurityGroup> = dbStackRef.requireOutput('hstPrimaryRdsClientSg') as pulumi.Output<aws.ec2.SecurityGroup>;

// SG the jumphost is in
const jumphostSg = new aws.ec2.SecurityGroup(`jumphost-${stackEnv}`, {
    vpcId: mainVpc.vpcId,
    tags: {
        Name: `jumphost-${stackEnv}`
    },
}, {provider: PulumiUtil.instance().awsProvider});

// SG allowing jumphost access
const allowJumphostSg = new aws.ec2.SecurityGroup(`allow-jumphost-${stackEnv}`, {
    vpcId: mainVpc.vpcId,
    tags: {
        Name: `allow-jumphost-${stackEnv}`
    },
}, {provider: PulumiUtil.instance().awsProvider});

// Allow Jumphost SG full egress
const allowAll = new aws.ec2.SecurityGroupRule(`allowAll-jumphost-egress-${stackEnv}`, {
    type: "egress",
    toPort: 0,
    protocol: "-1",
    fromPort: 0,
    cidrBlocks: ["0.0.0.0/0"],
    securityGroupId: jumphostSg.id,
}, {provider: PulumiUtil.instance().awsProvider, parent: jumphostSg});

// Security Group Rule - Allow jumphost full access to services using the allowJumphostSG
const jumphostTargetSGIngress = new aws.ec2.SecurityGroupRule(`jumphost-${stackEnv}`, {
    type: "ingress",
    toPort: 0,
    protocol: "-1",
    fromPort: 0,
    sourceSecurityGroupId: jumphostSg.id,
    securityGroupId: allowJumphostSg.id,
}, {provider: PulumiUtil.instance().awsProvider, parent: allowJumphostSg});


const jumphostSSMRole = new aws.iam.Role("jumphostSSMRole", {
    assumeRolePolicy: `{
    "Version": "2012-10-17",
    "Statement": {
      "Effect": "Allow",
      "Principal": {"Service": "ec2.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }
  }
  `,
    tags: mkTagsWithName('jumphostSSMRole'),
}, {provider: PulumiUtil.instance().awsProvider});

new aws.iam.RolePolicyAttachment("jumphostSSMAttach", {
    policyArn: "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
    role: jumphostSSMRole.name,
}, {provider: PulumiUtil.instance().awsProvider, parent: jumphostSSMRole});

const jumphostSSMProfile = new aws.iam.InstanceProfile("jumphostSSMProfile", {
    role: jumphostSSMRole,
}, {provider: PulumiUtil.instance().awsProvider, parent: jumphostSSMRole})

const size = "t3.nano";

const ami = pulumi.output(aws.ec2.getAmi({
    filters: [{
        name: "name",
        values: ["amzn2-ami-hvm-*-x86_64-ebs"],
    }],
    owners: ["amazon"],
    mostRecent: true,
}, {provider: PulumiUtil.instance().awsProvider}));


let jumpAmi = ami;
if (PulumiUtil.instance().isLocal) {
    jumpAmi = pulumi.output(aws.ec2.getAmi({
        owners: ["amazon"],
        mostRecent: true,
        tags: {'tag:ec2_vm_manager': "docker"},
        filters: [
            {name: "state", values: ["available"]},
        ],
    }, {provider: PulumiUtil.instance().awsProvider}));
}

// Create and launch an Amazon Linux EC2 instance into the public subnet.
const server = new aws.ec2.Instance(`jump-${stackEnv}`, {
    instanceType: size,
    vpcSecurityGroupIds: [jumphostSg.id, dbClientSg.id],
    ami: ami.id,
    iamInstanceProfile: jumphostSSMProfile,
    subnetId: privateSubnetIds[0],
    associatePublicIpAddress: false,
    tags: mkTagsWithName('main'),
    userData: `#!/bin/bash
  set -ex
  
  cd /tmp
  sudo systemctl enable amazon-ssm-agent
  sudo systemctl start amazon-ssm-agent
  `,
}, {provider: PulumiUtil.instance().awsProvider});

export const jumphostIp = server.privateIp;
export const jumphostName = server.privateDns;
export const jumphostInstanceID = server.id;

