import {asset} from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import {mkItemName, PulumiUtil, localArch} from "../../iac-shared";


let arch = 'arm64';
if (PulumiUtil.instance().isLocal && localArch == 'x86_64') {
    arch = 'x86_64';
}


const commonLambdaLayer = new aws.lambda.LayerVersion(
    mkItemName("common-layer"),
    {
        compatibleArchitectures: [arch],
        // compatibleRuntimes: ["python3.9"],
        code: new asset.FileArchive("../../src/common_layer/common_layer.zip"),
        layerName: mkItemName("common-layer"),
        licenseInfo: 'All Rights Reserved',
    },
    {
        provider: PulumiUtil.instance().awsProvider,
    }
);

const websocketLambdaLayer = new aws.lambda.LayerVersion(
    mkItemName("websocket-layer"),
    {
        compatibleArchitectures: [arch],
        // compatibleRuntimes: ["python3.9"],
        code: new asset.FileArchive("../../src/websocket_layer/websocket_layer.zip"),
        layerName: mkItemName("websocket-layer"),
        licenseInfo: 'All Rights Reserved',
    },
    {
        provider: PulumiUtil.instance().awsProvider,
    }
);

export const commonLambdaLayerArn = commonLambdaLayer.arn;
export const websocketLambdaLayerArn = websocketLambdaLayer.arn;
