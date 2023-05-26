import {interpolate} from "@pulumi/pulumi";
import {cloudfront} from "@pulumi/aws/types/input";
import {userApi, apiDomain} from "../apigw";
import {PulumiUtil} from "../../iac-shared";
import {baseCacheBehavior} from "./baseOrgin";

export const apiDistributionOrigin = {
    domainName: apiDomain,
    originId: "cloudfront-api-origin",
    originPath: "",
    customOriginConfig: {
        httpPort: 80,
        httpsPort: 443,
        originProtocolPolicy: "https-only",
        originSslProtocols: ["TLSv1.2"],
    },
    originShield: {
        // better caching
        enabled: true,
        originShieldRegion: PulumiUtil.instance().region || "",
    },
};

export const apiCacheBehavior: cloudfront.DistributionOrderedCacheBehavior = {
    ...baseCacheBehavior,
    pathPattern: interpolate`/${userApi.stage.stageName}/*`, // make sure this matches the stage name on the api-gw
    targetOriginId: apiDistributionOrigin.originId
};
