import * as aws from "@pulumi/aws";
import {mkItemName, mkTagsWithName, PulumiUtil} from "../iac-shared";

export const userTable = new aws.dynamodb.Table(
    mkItemName("user-table"),
    {
        name: mkItemName("user-table"),
        attributes: [
            {
                name: "id",
                type: "S",
            },
            {
                name: "rk",
                type: "S",
            },
        ],
        billingMode: "PAY_PER_REQUEST",
        hashKey: "id",
        rangeKey: "rk",
        // readCapacity: 10,
        // writeCapacity: 10,
        streamEnabled: true,
        streamViewType: "NEW_AND_OLD_IMAGES",
        replicas: [], // this converts table to a global table. add regions to replicate to. don't include region this table is in
        tags: mkTagsWithName("user-table"),
    },
    {provider: PulumiUtil.instance().awsProvider}
);

export const userTableName = userTable.name;
