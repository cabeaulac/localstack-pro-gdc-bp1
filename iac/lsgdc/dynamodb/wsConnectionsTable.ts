import * as aws from "@pulumi/aws";
import {mkItemName, mkTagsWithName, PulumiUtil} from "../../iac-shared";

// used to track all connected websocket clients.
// needed to be able to broadcast messages.
export const wsConnectionsTable = new aws.dynamodb.Table(
    mkItemName("wsConnectionsTable"),
    {
        attributes: [
            {name: "id", type: "S"},
            {name: "connectionId", type: "S"},
        ],
        hashKey: "id",
        rangeKey: "connectionId",
        ttl: {
            attributeName: "expires",
            enabled: true,
        },
        // globalSecondaryIndexes: [{
        //   name: 'principalId',
        //   hashKey: 'connectionId',
        //   projectionType: 'ALL',
        //   rangeKey: 'principalId'
        // }],
        billingMode: "PAY_PER_REQUEST",
        // writeCapacity: 10,
        // readCapacity: 10,
        tags: mkTagsWithName("wsConnectionsTable"),
    },
    {provider: PulumiUtil.instance().awsProvider}
);

export const wsConnectionsTableName = wsConnectionsTable.name;
