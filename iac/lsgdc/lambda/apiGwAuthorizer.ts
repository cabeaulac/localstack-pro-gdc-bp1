import {mkItemName, PulumiUtil, siteDomainName} from "../../iac-shared";
import {lambdaExecutionRole} from "../iam";
import {basicPythonLambda} from "../lambda-shared";
import {Output} from "@pulumi/pulumi/output";
import {BucketObject} from "@pulumi/aws/s3";
import {siteBucket} from "../s3";
import * as pulumi from "@pulumi/pulumi";
import {interpolate} from "@pulumi/pulumi";

let JWKS_URI: Output<string> = Output.create(
    pulumi.interpolate`${PulumiUtil.instance().auth0Domain}/.well-known/jwks.json`
);

if (PulumiUtil.instance().isActive("test_oauth") && !PulumiUtil.instance().isLocal) {
    const JWKS_LOCATION = `.well-known/${Date.now()}/jwks.json`;

    const jwksPublicJson = new BucketObject(
        mkItemName("jwks_public"),
        {
            key: "ui/" + JWKS_LOCATION,
            bucket: siteBucket.id,
            source: new pulumi.asset.FileAsset(
                "../auto_tests/resources/ext_pk/auth0_jwks.json"
            ),
        },
        {provider: PulumiUtil.instance().awsProvider}
    );

    JWKS_URI = jwksPublicJson.id.apply(
        () => `https://${siteDomainName}/${JWKS_LOCATION}`
    );
}

JWKS_URI.apply((v) => {
    pulumi.log.info(`Using jwks.json from: ${v}`);
});


// Auth0 authorizer used by rest and ws endpoints
export const apiGwAuthorizerLambda = basicPythonLambda("rest-authorizer", {
    archiveName: "../../src/auth0_authorizer/auth0_authorizer.zip",
    executionRole: lambdaExecutionRole,
    timeout: 12,
    memorySize: 128,
    environment: {
        AUDIENCE: PulumiUtil.instance().auth0Audience,
        JWKS_URI: JWKS_URI,
        TOKEN_ISSUER: `${PulumiUtil.instance().auth0Domain}/`,
        LOGGING_LEVEL: PulumiUtil.instance().loggingLevel,
        // UNVERIFIED_SSL: PulumiUtil.instance().isLocal
    },
});
