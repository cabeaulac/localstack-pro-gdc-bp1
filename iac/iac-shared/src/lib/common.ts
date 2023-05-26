import {Config, getStack, Output} from "@pulumi/pulumi";

export const [resourceBaseName, stackEnv] = getStack().split(".");

const config = new Config();

export const commonTags: Record<string, string> = {
    env: stackEnv,
    org: "IT",
    company: config.get("company") || "IVTech",
    stack: getStack(),
};
// add tags to make it easier to find things related to this stack
// apply these tags to all taggable things
export const baseTags = Object.assign({}, commonTags);

// helper to create resource name that includes stack and env
export const DEPLOYMENT_TARGET = `${resourceBaseName}-${stackEnv}`;
// helper to create resource name that includes stack and env
export const mkItemName = (name: string): string => `${resourceBaseName}-${name}-${stackEnv}`;
// create new object from baseTags that has given Name tag created with mkItemName
export const mkTagsWithName = (name: string) => Object.assign(
    {}, baseTags, {
        'Name': mkItemName(name)
    }
);

export const toNativeTags = (oldTags: Record<string, string>) =>
    Object.keys(oldTags).map((key) => {
        return {key, value: oldTags[key]}
    });
