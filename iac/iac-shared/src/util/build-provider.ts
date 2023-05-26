import {existsSync} from "fs";
import {Writable} from "stream";
import {spawn} from "child_process";
import * as pulumi from "@pulumi/pulumi";
import {ID} from "@pulumi/pulumi";
import {CheckFailure, CheckResult} from "@pulumi/pulumi/dynamic";
import {hashFolder, nanoid} from "../lib/hashing";
import {normalizePath, promiseFromChildProcess} from "../lib/utils";
import Dict = NodeJS.Dict;

/***
 * Options for how to monitor hashDir
 */
export interface CustomBuildResourceHashOptions {
    /*** Should hash be recursive */
    recursive: boolean;
    /*** If provided only files matching RegExp will be hashed */
    includePattern?: string | null;
    /*** If provided files matching RegExp will be omitted from hash */
    excludePattern?: string | null;
}

export const defaultExcludePattern = [
    ".git",
    ".idea",
    ".idea_modules",
    ".viscode",
    ".history",
    "node_modules",
    ".gitignore",
    ".editorconfig",
    "dist",
    ".spec.json",
    ".DS_Store",
    ".AppleDouble",
    ".LSOverride",
];

/***
 * Default resource hashing options.
 * Recursive with some basic excludes to speed up hashing.
 */
export const DefaultCustomBuildResourceHashOptions: CustomBuildResourceHashOptions =
    {
        recursive: true,
        excludePattern: "/(" + defaultExcludePattern.join("|") + ")/?",
    };

export type CaptureBuildOutputOption = "always" | "onError" | "never";

/***
 * Input props for CustomBuildResource
 */
export interface CustomBuildResourceInputs {
    /*** Folder in which to run buildCmd. */
    workingDir: pulumi.Input<string>;
    /*** Command to execute. */
    buildCmd: pulumi.Input<string>;
    /*** Additional environment variables for command to execute. */
    buildEnv?: pulumi.Input<Dict<string | pulumi.Output<string>>>;
    /*** Shell used to execute command. Defaults to bash */
    shell?: pulumi.Input<boolean | string | undefined>;
    /*** Capture output of build and display on failure. */
    captureBuildOutput: pulumi.Input<CaptureBuildOutputOption>;
    /*** List of build output files or folders. If not found a build is triggered without having to hash everything.
     * Resource build is considered failed if artifacts do not exist after build completes. */
    outputArtifacts: pulumi.Input<string[]>;
    /*** Options for how to monitor hashDir. If not provided then DefaultCustomBuildResourceHashOptions will be used. */
    hashOptions?: pulumi.Input<CustomBuildResourceHashOptions>;
    /*** Folder to monitor for changes. */
    hashDir: pulumi.Input<string>;
    /*** Pass any output value to this to have build wait for it before continuing */
    waitFor?: pulumi.Input<any>;
    /*** time in milliseconds to cancel build with error. Defaults to 0 which means no timeout */
    buildTimeout?: pulumi.Input<number>;
}

/***
 * Inputs used by CustomBuildResourceProviderInputs
 */
export interface CustomBuildResourceProviderInputs {
    /*** Folder in which to run buildCmd */
    workingDir: string;
    /*** Command to execute. */
    buildCmd: string;
    /*** Additional environment variables for command to execute. */
    buildEnv?: Dict<string>;
    /*** Shell used to execute command. Defaults to bash */
    shell?: boolean | string | undefined;
    /*** Capture output of build and display on failure. */
    captureBuildOutput: CaptureBuildOutputOption;
    /*** List of build output files or folders. If not found a build is triggered without having to hash everything.
     * Resource build is considered failed if artifacts do not exist after build completes. */
    outputArtifacts: string[];
    /*** Options for how to monitor hashDir. If not provided then DefaultCustomBuildResourceHashOptions will be used. */
    hashOptions: CustomBuildResourceHashOptions;
    /*** Folder to monitor for changes. */
    hashDir: string;
    /*** Pass any output value to this to have build wait for it before continuing */
    waitFor?: any;
    /*** time in milliseconds to cancel build with error. Defaults to 0 which means no timeout */
    buildTimeout?: number;
}

/***
 * Outputs of provider used by CustomBuildResource
 */
export interface CustomBuildResourceProviderOutputs
    extends CustomBuildResourceProviderInputs {
    /*** Final hash of all hashes in hashDir. */
    hash: string;
}

/***
 * Outputs of CustomBuildResource
 */
export interface CustomBuildResourceOutputs {
    /*** Folder in which to run buildCmd. */
    workingDir: pulumi.Output<string>;
    /*** Command to execute. If you need to execute more than one then chain with && or ;*/
    buildCmd: pulumi.Output<string>;
    /*** Additional environment variables for command to execute. */
    buildEnv?: pulumi.Output<Dict<string>>;
    /*** Shell used to execute command. Defaults to bash */
    shell: pulumi.Output<boolean | string | undefined>;
    /*** Capture output of build and display on failure. */
    captureBuildOutput: pulumi.Output<CaptureBuildOutputOption>;
    /*** List of build output files or folders. If not found a build is triggered without having to hash everything.
     * Resource build is considered failed if artifacts do not exist after build completes. */
    outputArtifacts: pulumi.Output<string[]>;
    /*** Options for how to monitor hashDir. */
    hashOptions: pulumi.Output<CustomBuildResourceHashOptions>;
    /*** Folder to monitor for changes. */
    hashDir: pulumi.Output<string>;
    /*** Final hash of all hashes in hashDir. */
    hash: pulumi.Output<string>;
    /*** Pass any output value to this to have build wait for it before continuing */
    waitFor?: pulumi.Output<any>;
    /*** time in milliseconds to cancel build with error. Defaults to 0 which means no timeout */
    buildTimeout?: pulumi.Output<number>;
}

/***
 * Custom resource provider that will track changes to a folder and execute build if needed.
 * Useful for ensuring assets are built before sending to S3.
 */
export class CustomBuildResource
    extends pulumi.dynamic.Resource
    implements CustomBuildResourceOutputs {
    /*** Folder in which to run buildCmd. */
    public readonly workingDir!: pulumi.Output<string>;
    /*** Command to execute. If you need to execute more than one then chain with && or ;*/
    public readonly buildCmd!: pulumi.Output<string>;
    /*** Shell used to execute command. Defaults to bash */
    public readonly shell!: pulumi.Output<string>;
    /*** Capture output of build and display on failure. */
    public readonly captureBuildOutput!: pulumi.Output<CaptureBuildOutputOption>;
    /*** List of build output files or folders. If not found a build is triggered without having to hash everything.
     * Resource build is considered failed if artifacts do not exist after build completes. */
    public readonly outputArtifacts!: pulumi.Output<string[]>;
    /*** Options for how to monitor hashDir. */
    public readonly hashOptions!: pulumi.Output<CustomBuildResourceHashOptions>;
    /*** Folder to monitor for changes. */
    public readonly hashDir!: pulumi.Output<string>;
    /*** Final hash of all hashes in hashDir. */
    public readonly hash!: pulumi.Output<string>;
    /*** time in milliseconds to cancel build with error. Defaults to 0 which means no timeout */
    public readonly buildTimeout?: pulumi.Output<number>;

    constructor(
        name: string,
        props: CustomBuildResourceInputs,
        opts?: pulumi.CustomResourceOptions
    ) {
        const buildProvider: pulumi.dynamic.ResourceProvider = {
            /***
             * Sanity check inputs and set any defaults.
             * @param olds Old inputs if previously run
             * @param news Current / New inputs
             */
            async check(
                olds: CustomBuildResourceProviderInputs,
                news: CustomBuildResourceProviderInputs
            ): Promise<CheckResult> {
                const failures: CheckFailure[] = [];
                if (!existsSync(news.workingDir)) {
                    failures.push({
                        property: "workingDir",
                        reason: "workingDir folder not found",
                    });
                }
                if (!news.buildCmd) {
                    failures.push({
                        property: "buildCmd",
                        reason: "Must provide a build command",
                    });
                }
                if (!news.outputArtifacts) {
                    failures.push({
                        property: "outputArtifact",
                        reason: "Must provide a build output directory",
                    });
                }
                if (!existsSync(news.hashDir)) {
                    failures.push({
                        property: "hashDir",
                        reason: "hashDir folder not found",
                    });
                }
                if (!news.shell) {
                    news.shell = "bash";
                }
                news.workingDir = normalizePath(news.workingDir);
                news.outputArtifacts = news.outputArtifacts.map(normalizePath);
                news.hashDir = normalizePath(news.hashDir);

                if (failures.length > 0) {
                    return {
                        failures,
                    };
                }
                // Ensure we have a hashOptions value for provider
                if (!news.hashOptions) {
                    news.hashOptions = {...DefaultCustomBuildResourceHashOptions};
                }
                return {
                    inputs: news,
                };
            },
            /***
             * Get hash for hashFolder execute build if needed.
             * @param inputs
             */
            async create(
                inputs: CustomBuildResourceProviderInputs
            ): Promise<pulumi.dynamic.CreateResult> {
                let childOut: Writable | null = null;
                if (inputs.captureBuildOutput !== "never") {
                    if (inputs.captureBuildOutput === "always") {
                        childOut = process.stdout;
                    } else {
                        //   childOut = new MemStream(); // todo capture to memory stream has issue with pulumi which cant serialize native types
                        childOut = process.stdout;
                    }
                }
                // console.log(inputs);
                let hash;
                try {
                    // Execute build. Throws Error on non-zero exit code
                    console.log(
                        name,
                        "Starting build",
                        inputs.workingDir,
                        inputs.shell,
                        inputs.buildCmd,
                        inputs.buildEnv
                    );
                    const envVars = inputs.buildEnv ?? {};
                    await promiseFromChildProcess(
                        spawn(inputs.buildCmd, {
                            shell: inputs.shell,
                            cwd: inputs.workingDir,
                            env: {...process.env, ...envVars, MSYS_NO_PATHCONV: "1"}, // MSYS_NO_PATHCONV is needed on Windows to prevent path munging
                            stdio: [
                                "ignore",
                                childOut ? "pipe" : "ignore",
                                childOut ? "pipe" : "ignore",
                            ],
                        }),
                        childOut,
                        childOut,
                        inputs.buildTimeout
                    );
                    const missing = inputs.outputArtifacts.find((a) => !existsSync(a));
                    if (missing) {
                        throw new Error("Missing output artifact: " + missing);
                    }
                    console.log(name, "Computing source hash 1.");
                    hash = await hashFolder(
                        inputs.hashDir,
                        inputs.hashOptions.recursive,
                        inputs.hashOptions.includePattern
                            ? new RegExp(inputs.hashOptions.includePattern)
                            : null,
                        inputs.hashOptions.excludePattern
                            ? new RegExp(inputs.hashOptions.excludePattern)
                            : null
                    );
                    console.info(name, "New build Hash: " + hash);
                } catch (e) {
                    console.error(name, e);
                    if (inputs.captureBuildOutput === "onError" && childOut) {
                        // console.error(childOut.toString()); // todo output memory stream
                    }
                    throw e;
                }

                const outs: CustomBuildResourceProviderOutputs = {
                    ...inputs,
                    hash,
                };
                return {
                    id: nanoid(),
                    outs,
                };
            },
            /***
             * Check if parameters have changed or outputArtifacts are missing or hash has changed for hashDir.
             * @param id
             * @param olds
             * @param news
             */
            async diff(
                id: ID,
                olds: CustomBuildResourceProviderOutputs,
                news: CustomBuildResourceProviderInputs
            ): Promise<pulumi.dynamic.DiffResult> {
                // if replaces gets populated with anything then a create will be triggered
                const replaces: string[] = [];
                if (olds.workingDir !== news.workingDir) {
                    replaces.push("workingDir");
                }
                if (olds.buildCmd !== news.buildCmd) {
                    replaces.push("buildCmd");
                }
                if (JSON.stringify(olds.buildEnv) !== JSON.stringify(news.buildEnv)) {
                    replaces.push("buildEnv");
                }
                if (
                    olds.hashOptions.includePattern !== news.hashOptions.includePattern
                ) {
                    replaces.push("hashOptions.includePattern");
                }
                if (
                    olds.hashOptions.excludePattern !== news.hashOptions.excludePattern
                ) {
                    replaces.push("hashOptions.excludePattern");
                }
                // returns true if any outputArtifacts are missing. Stops searching after 1st not found for speed.
                const missing = news.outputArtifacts.find((a) => !existsSync(a));
                if (missing) {
                    // await pulumi.log.info('One or more missing output artifact: ' + missing);
                    console.log(
                        name,
                        "One or more missing output artifacts. Rebuild Required: ",
                        missing
                    );
                    replaces.push("outputArtifact");
                    replaces.push("hash");
                } else {
                    console.log(name, "Computing source hash 2.");
                    const hash = await hashFolder(
                        news.workingDir,
                        news.hashOptions.recursive,
                        news.hashOptions.includePattern
                            ? new RegExp(news.hashOptions.includePattern)
                            : null,
                        news.hashOptions.excludePattern
                            ? new RegExp(news.hashOptions.excludePattern)
                            : null
                    );
                    if (olds.hash !== hash) {
                        console.log(name, "Source hash changed. Rebuild Required");
                        replaces.push("hash");
                    }
                }
                return {
                    changes: replaces.length > 0,
                    replaces,
                    deleteBeforeReplace: false,
                };
            },
        };

        super(
            buildProvider,
            name,
            {
                ...props,
                hash: undefined,
            },
            opts
        );
    }
}
