import {cloudfront} from "@pulumi/aws/types/input";

export const baseCacheBehavior = {
  // pathPattern: ``, // make sure this matches the stage name on the api-gw
  allowedMethods: ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"],
  cachedMethods: ["GET", "HEAD"],
  // targetOriginId: ``,
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
  // don't need the rewrite if we have CF use a pathPattern that matches the stage name of the api-gw
  // lambdaFunctionAssociations: [
  //   // used to strip /index.html added by CF defaultRootObject and /api/chat route prefix
  //   {
  //     eventType: 'origin-request',
  //     lambdaArn: wsChatOriginRewriteLambda.qualifiedArn // must use versioned arn
  //   }
  // ]
};
