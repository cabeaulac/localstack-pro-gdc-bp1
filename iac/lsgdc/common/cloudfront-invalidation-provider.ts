import {fromEnv} from "@aws-sdk/credential-providers";
import * as pulumi from "@pulumi/pulumi";
import {ID, Output} from "@pulumi/pulumi";
import {CheckResult, CreateResult, DiffResult} from "@pulumi/pulumi/dynamic";
import {nanoid, stackEnv} from "../../iac-shared";
import {
    CloudFront,
    CreateInvalidationCommandInput,
} from "@aws-sdk/client-cloudfront";

export interface CloudfrontInvalidationResourceInputs {
    cfDistributionId: pulumi.Input<ID>;
    invalidationPaths: pulumi.Input<string[]>;
    buildHash: pulumi.Input<string>;
    firstRun?: pulumi.Input<boolean>;
}

export interface CloudfrontInvalidationResourceOutputs {
    cfDistributionId: pulumi.Output<ID>;
    invalidationPaths: pulumi.Output<string[]>;
    invalidationId: pulumi.Output<string | undefined>;
    buildHash: pulumi.Output<string>;
    firstRun: pulumi.Output<boolean>;
}

interface CloudfrontInvalidationProviderInputs {
    cfDistributionId: ID;
    invalidationPaths: string[];
    buildHash: string;
    firstRun: boolean;
}

interface CloudfrontInvalidationProviderOutputs
    extends CloudfrontInvalidationProviderInputs {
    invalidationId: string | undefined;
}

export class CloudfrontInvalidationResource
    extends pulumi.dynamic.Resource
    implements CloudfrontInvalidationResourceOutputs {
    public readonly cfDistributionId!: Output<ID>;
    public readonly invalidationId!: Output<string>;
    public readonly invalidationPaths!: Output<string[]>;
    public readonly buildHash!: pulumi.Output<string>;
    public readonly firstRun!: pulumi.Output<boolean>;
    // strange issue where check method is being called twice and the 2nd time there are no old params to check if 1st run.
    // using this to save old vals from first call to check
    checked: any;

    constructor(
        name: string,
        props: CloudfrontInvalidationResourceInputs,
        opts?: pulumi.CustomResourceOptions
    ) {
        let that: any;
        const cfInvalidationProvider: pulumi.dynamic.ResourceProvider = {
            check: async (
                olds: CloudfrontInvalidationResourceInputs,
                news: CloudfrontInvalidationResourceInputs
            ): Promise<CheckResult> => {
                // console.log('******* check ' + name, {
                //   old: { ...olds, __provider: null },
                //   new: { ...news, __provider: null }
                // });
                if (!that.checked) {
                    that.checked = {...olds, __provider: null};
                }
                const firstRun = !that.checked.buildHash;
                return {
                    inputs: {...news, firstRun},
                };
            },
            // update: async (id: ID, olds: CloudfrontInvalidationResourceInputs, news: CloudfrontInvalidationResourceInputs): Promise<UpdateResult> => {
            //   console.log('******* update ' + name, {
            //     id,
            //     old: { ...olds, __provider: null },
            //     new: { ...news, __provider: null }
            //   });
            //
            //   return {
            //     outs: { ...news }
            //   };
            // },
            create: async (
                inputs: CloudfrontInvalidationProviderInputs
            ): Promise<CreateResult> => {
                // console.log('******* create ' + name, {firstRun: inputs.firstRun, buildHash: inputs.buildHash, cfDistributionId: inputs.cfDistributionId});
                // console.log('******* create ' + name, { ...inputs, __provider: null });

                let invalidationId: string | undefined = "";
                if (!inputs.firstRun) {
                    console.log(name, "Not first run, creating invalidation");
                    const input: CreateInvalidationCommandInput = {
                        DistributionId: inputs.cfDistributionId,
                        InvalidationBatch: {
                            CallerReference: inputs.buildHash,
                            Paths: {
                                Items: inputs.invalidationPaths,
                                Quantity: inputs.invalidationPaths.length,
                            },
                        },
                    };

                    let resConfig: Record<string, any> = {
                        credentials: fromEnv(),
                    };
                    if (stackEnv.endsWith("local")) {
                        resConfig["endpoint"] =
                            process.env.LOCALSTACK_ENDPOINT || "http://localstack:4566";
                        resConfig["region"] = "us-west-2";
                    }

                    const res: any = await new CloudFront(resConfig).createInvalidation(
                        input
                    );
                    invalidationId = res.Invalidation?.Id;
                    // console.log(JSON.stringify(res, null, 2));
                } else {
                    console.log(name, "Is first run, NOT creating invalidation");
                }
                const outs: CloudfrontInvalidationProviderOutputs = {
                    ...inputs,
                    invalidationId,
                };
                return {
                    id: nanoid(),
                    outs,
                };
            },
            diff: async (
                id: ID,
                olds: CloudfrontInvalidationProviderOutputs,
                news: CloudfrontInvalidationProviderInputs
            ): Promise<DiffResult> => {
                // console.log('******* diff ' + name, {
                //   id,
                //   old: { ...olds, __provider: null },
                //   new: { ...news, __provider: null }
                // });
                const replaces: string[] = [];
                // only invalidate if we had a previous hash and the hash has changed
                if (olds.buildHash && olds.buildHash !== news.buildHash) {
                    replaces.push("buildHash");
                }
                return {
                    changes: replaces.length > 0,
                    replaces,
                    deleteBeforeReplace: false,
                };
            },
        };
        super(
            cfInvalidationProvider,
            name,
            {
                ...props,
                invalidationId: undefined,
            },
            opts
        );
        that = this; // TODO very hacky, will come back to this once i have time to figure out the strange lifecycle issues
    }
}
