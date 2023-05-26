import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import {asset} from "@pulumi/pulumi";
import {Input} from "@pulumi/pulumi/output";
import {Resource} from "@pulumi/pulumi/resource";
import {mkItemName, mkLogGroup, PulumiUtil} from "../../iac-shared";
import {commonLambdaLayerArn} from "./lambdaLayer";

export interface BasicPythonLambdaArgs {
    executionRole: aws.iam.Role;
    archiveName: string;
    timeout?: pulumi.Input<number>;
    environment: any;
    dependsOn?: Input<Input<Resource>[]> | Input<Resource>;
    memorySize?: number;
    layers?: pulumi.Input<string>[];
}

export const basicPythonLambda = (
    name: string,
    args: BasicPythonLambdaArgs
): aws.lambda.Function => {
    name = name + "-lambda";
    // Set LOCALSTACK in the env for everything.
    args.environment["LOCALSTACK"] = PulumiUtil.instance().isLocal;
    const func = new aws.lambda.Function(
        mkItemName(name),
        {
            runtime: "python3.9",
            code: new asset.FileArchive(args.archiveName),
            layers: [commonLambdaLayerArn, ...(args.layers || [])],
            handler: "app.handler",
            role: args.executionRole.arn,
            timeout: args.timeout || 60,
            memorySize: args.memorySize || 256,
            environment: {
                variables: args.environment,
            },
        },
        {
            dependsOn: args.dependsOn,
            provider: PulumiUtil.instance().awsProvider,
        }
    );
    func.name.apply((fn) => mkLogGroup(`/aws/lambda/${fn}`));
    return func;
};
