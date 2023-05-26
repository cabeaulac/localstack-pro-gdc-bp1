import * as aws from "@pulumi/aws";

import {mkItemName, mkTagsWithName, PulumiUtil, siteDomainName} from "../../iac-shared";
import {cflogBucket} from "../index";
import {apiCacheBehavior, apiDistributionOrigin} from "./apiOrigin";
import {siteOrigin} from "./siteOrigin";
import {siteCert} from "../common/dns-cert";
import {wsCacheBehavior, wsDistributionOrigin} from "./websocketOrigin";

let userDistro: aws.cloudfront.Distribution | undefined;
if (!PulumiUtil.instance().isLocal) {
    userDistro = new aws.cloudfront.Distribution(
        mkItemName("cf-distro"),
        {
            origins: [siteOrigin, wsDistributionOrigin, apiDistributionOrigin],
            // origins: [siteOrigin, wsDistributionOrigin],
            enabled: true,
            isIpv6Enabled: false,
            comment: "LSGDC",
            defaultRootObject: `ui/index.html`, // serve index.html when url ends in /
            loggingConfig: {
                // log to same bucket as frontend using logs/ prefix
                includeCookies: false,
                bucket: cflogBucket.bucketDomainName,
                prefix: "logs/",
            },
            aliases: PulumiUtil.instance().isActive("use-route53")
                ? [siteDomainName]
                : undefined,
            defaultCacheBehavior: {
                allowedMethods: ["GET", "HEAD", "OPTIONS"],
                cachedMethods: ["GET", "HEAD"],
                targetOriginId: siteOrigin.originId,
                forwardedValues: {
                    queryString: false, // static content doesn't need query string
                    headers: [],

                    cookies: {
                        forward: "none",
                    },
                },
                compress: true,
                viewerProtocolPolicy: "redirect-to-https",
                minTtl: 1,
                defaultTtl: 86400,
                maxTtl: 31536000,
            },
            orderedCacheBehaviors: [wsCacheBehavior, apiCacheBehavior],
            // orderedCacheBehaviors: [wsCacheBehavior],
            priceClass: "PriceClass_100", // US and Europe
            restrictions: {
                geoRestriction: {
                    restrictionType: "whitelist",
                    locations: [
                        "US", // USA
                        "CA", // CANADA
                        "GB", // UK / Ireland
                    ],
                },
            },
            viewerCertificate: {
                cloudfrontDefaultCertificate: !siteCert,
                acmCertificateArn: siteCert?.arn,
                minimumProtocolVersion: "TLSv1.2_2021", // api-gw does not support higher than this
                sslSupportMethod: "sni-only",
            },
            customErrorResponses: [
                // allow virtual routes in SPA to get routed to index.html
                {
                    errorCode: 403,
                    errorCachingMinTtl: 10,
                    responseCode: 200,
                    responsePagePath: "/index.html",
                },
                {
                    errorCode: 404,
                    errorCachingMinTtl: 10,
                    responseCode: 200,
                    responsePagePath: "/index.html",
                },
            ],
            tags: mkTagsWithName("cf-distro"),
        },
        {provider: PulumiUtil.instance().awsProvider}
    );
} else {
    userDistro = undefined;
}

export const userCfDistribution = userDistro;
