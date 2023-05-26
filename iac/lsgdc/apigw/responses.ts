const responseParameters = {
  // 'gatewayresponse.header.method.response.header.Access-Control-Allow-Credentials': `'true'`,
  "gatewayresponse.header.method.response.header.Access-Control-Allow-Headers": `'Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token, Origin, X-Requested-With, Accept'`,
  "gatewayresponse.header.method.response.header.Access-Control-Allow-Methods": `'GET, POST, OPTIONS, PUT, PATCH, DELETE'`,
  "gatewayresponse.header.method.response.header.Access-Control-Allow-Origin": `'*'`,
};

export const gatewayResponses = {
  UNAUTHORIZED: {
    statusCode: 401,
    responseParameters,
    responseTemplates: {
      "application/json": '{"message":$context.error.messageString}',
    },
  },
  ACCESS_DENIED: {
    statusCode: 401,
    responseParameters,
    responseTemplates: {
      "application/json": '{"message":$context.error.messageString}',
    },
  },
  MISSING_AUTHENTICATION_TOKEN: {
    statusCode: 401,
    responseParameters,
    responseTemplates: {
      "application/json": '{"message":$context.error.messageString}',
    },
  },
  EXPIRED_TOKEN: {
    statusCode: 403,
    responseParameters,
    responseTemplates: {
      "application/json": '{"message":$context.error.messageString}',
    },
  },
};
