import {wsApiDomain, wsApiKeys} from "../apigw";
import {PulumiUtil} from "../../iac-shared";

export const wsDistributionOrigin = {
    domainName: wsApiDomain,
    originId: "ws-api-origin",
    originPath: "",
    customOriginConfig: {
        httpPort: 80,
        httpsPort: 443,
        originProtocolPolicy: "https-only",
        originSslProtocols: ["TLSv1.2"],
    },
    customHeaders: PulumiUtil.instance().isLocal
        ? []
        : [{name: "X-API-Key", value: wsApiKeys!.keys[0].apikey.value!}], // this needs to be sent to api-gw
};

export const wsCacheBehavior = {
    pathPattern: `/ws/*`, // make sure this matches the stage name on the api-gw
    allowedMethods: ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"],
    cachedMethods: ["GET", "HEAD"],
    targetOriginId: wsDistributionOrigin.originId,
    forwardedValues: {
        queryString: true, // pass query string to api, so it can get connect ticket
        headers: [
            "Authorization",
            "Sec-WebSocket-Key",
            "Sec-WebSocket-Version",
            "Sec-WebSocket-Protocol",
            "Sec-WebSocket-Accept",
            "Sec-WebSocket-Extensions",
            "Accept-Encoding",
        ], // make sure we pass Authorization header to api
        cookies: {
            forward: "none", // api does not need cookies
        },
    },
    minTtl: 0,
    defaultTtl: 0,
    maxTtl: 0,
    compress: true,
    viewerProtocolPolicy: "https-only",
};
