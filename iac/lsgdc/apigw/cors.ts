import {RawDataRoute} from "@pulumi/awsx/classic/apigateway/api";

export const mockRoute = (body: any, requireApiKey: boolean = false): any => {
    const ret: any = {
        consumes: ["application/json"],
        produces: ["application/json"],
        responses: {
            "200": {
                description: "200 response",
                schema: {
                    type: "object",
                },
                headers: {
                    "Access-Control-Allow-Origin": {
                        type: "string",
                    },
                    "Access-Control-Allow-Methods": {
                        type: "string",
                    },
                    "Access-Control-Allow-Headers": {
                        type: "string",
                    },
                },
            },
        },
        "x-amazon-apigateway-integration": {
            responses: {
                default: {
                    statusCode: "200",
                    responseParameters: {
                        "method.response.header.Access-Control-Allow-Methods":
                            "'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT'",
                        "method.response.header.Access-Control-Allow-Headers":
                            "'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'",
                        "method.response.header.Access-Control-Allow-Origin": "'*'",
                    },
                    responseTemplates: {
                        "application/json": body ? JSON.stringify(body) : "",
                    },
                },
            },
            requestTemplates: {
                "application/json": '{"statusCode": 200}',
            },
            passthroughBehavior: "when_no_match",
            type: "mock",
        },
    };
    if (requireApiKey) {
        ret.security = [
            {
                api_key: [],
            },
        ];
    }
    return ret;
};

export const corsRoute: RawDataRoute[] = [
    {
        path: "/{proxy+}",
        method: "OPTIONS",
        data: mockRoute(null, false),
    },
];

export const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, PATCH, DELETE",
    "Access-Control-Allow-Headers":
        "Origin, X-Requested-With, Content-Type, Accept, Authorization",
};
