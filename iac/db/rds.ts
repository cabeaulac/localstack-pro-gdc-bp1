import * as aws from "@pulumi/aws";
import {mkItemName, mkTagsWithName, PulumiUtil, stackEnv} from "../iac-shared";
import * as pulumi from "@pulumi/pulumi";
import * as awsx from "@pulumi/awsx";
import * as random from '@pulumi/random';
import {toplevelStackRef} from "./index";
import {hstPrimaryRdsSg} from "./security-groups";
import {RandomPassword} from "@pulumi/random";

const privateSubnetIds: pulumi.Output<[string]> = toplevelStackRef.requireOutput('privateSubnetIds') as pulumi.Output<[string]>;
const mainVpc = toplevelStackRef.requireOutput('mainVpc') as pulumi.Output<awsx.ec2.Vpc>;


// export const postgresql = new aws.rds.Cluster(mkItemName("postgresql"), {
//     availabilityZones: [
//         "us-west-2a",
//         "us-west-2b",
//         "us-west-2c",
//     ],
//     backupRetentionPeriod: 5,
//     clusterIdentifier: "lsgdc-cluster",
//     databaseName: "mydb",
//     engine: "aurora-postgresql",
//     masterPassword: "bar",
//     masterUsername: "foo",
//     preferredBackupWindow: "07:00-09:00",
//     skipFinalSnapshot: true,
//     tags: mkTagsWithName("postgresql")
// }, {provider: PulumiUtil.instance().awsProvider});
//
//
// const clusterInstances: aws.rds.ClusterInstance[] = [];
// for (const range = {value: 0}; range.value < 2; range.value++) {
//     clusterInstances.push(new aws.rds.ClusterInstance(`clusterInstances-${range.value}`, {
//         identifier: `aurora-cluster-demo-${range.value}`,
//         clusterIdentifier: postgresql.id,
//         instanceClass: "db.t3.micro",
//         engine: "aurora-postgresql",
//         // engineVersion: postgresql.engineVersion,
//     }, {provider: PulumiUtil.instance().awsProvider}));
// }

// Generate a random password for the RDS Cluster
const dbClusterPassword = new random.RandomPassword('password',
    {
        length: 16,
        special: true,
        overrideSpecial: `[]{}()#!`
    });


// Create a DB subnet group.
const primarySubnetGroup = new aws.rds.SubnetGroup(
    mkItemName('primary-subnet-group'),
    {
        // name: mkItemName('subnet-group'),
        subnetIds: privateSubnetIds,
        tags: mkTagsWithName('primary-subnet-group')
    }, {provider: PulumiUtil.instance().awsProvider}
);

const primaryParamGroup = new aws.rds.ParameterGroup(mkItemName("primary-db-param-group"), {
    family: "postgres15"
}, {provider: PulumiUtil.instance().awsProvider});

// Localstack instance class
let instanceClass = "db.t3.micro";
// If deploying to AWS, change instance class
if (!PulumiUtil.instance().isLocal) {
    // This is in the free tier.
    instanceClass = "db.t4g.micro";
}


export const singleDbInstance = new aws.rds.Instance(mkItemName("pg-inst"), {
    allocatedStorage: 20,
    dbName: "hstdb",
    engine: "postgres",
    engineVersion: "15",
    instanceClass: instanceClass,
    parameterGroupName: primaryParamGroup.name,
    password: dbClusterPassword.result,
    skipFinalSnapshot: true,
    dbSubnetGroupName: primarySubnetGroup.id,
    vpcSecurityGroupIds: [hstPrimaryRdsSg.id],
    username: "hstuser",
    tags: mkTagsWithName("pg-inst")
}, {provider: PulumiUtil.instance().awsProvider});

export const dbUsWest2Pw = dbClusterPassword.result;