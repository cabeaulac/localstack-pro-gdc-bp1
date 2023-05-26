import {CustomBuildResource, folderToS3, mkItemName, apiStage, apiVersion, PulumiUtil} from "../../iac-shared";
import {siteBucket} from "./siteBucket";

const frontendProjectDir = "../../ui/lsgdc-portal";
export const distDir = `${frontendProjectDir}/dist`;

console.log('uipub apiStage', apiStage);
console.log('uipub apiVersion', apiVersion);

let uiBuildResLocal: CustomBuildResource | undefined = undefined;
let uiBucketItemsLocal = undefined;
if (!PulumiUtil.instance().isLocal) {
    uiBuildResLocal = new CustomBuildResource(mkItemName("ui-publisher"), {
        buildCmd: "make",
        buildEnv: {
            VITE_IS_LOCAL: PulumiUtil.instance().isLocal.toString(),
            VITE_AUTH0_AUDIENCE: PulumiUtil.instance().auth0Audience,
            VITE_AUTH0_CLIENT_ID: PulumiUtil.instance().auth0ClientId,
            VITE_AUTH0_DOMAIN: PulumiUtil.instance().auth0Domain,
            VITE_APP_VERSION: PulumiUtil.instance().appVersion,
            VITE_API_STAGE: apiStage,
            VITE_API_VERSION: apiVersion,
        },
        captureBuildOutput: !PulumiUtil.instance().isLocal ? "onError" : "always",
        workingDir: frontendProjectDir,
        outputArtifacts: [distDir],
        buildTimeout: 300000,
        hashDir: frontendProjectDir,
        hashOptions: {
            recursive: true,
            excludePattern:
                "/(.idea|.vscode|node_modules|.gitignore|.editorconfig|dist|.spec)/?",
        },
        // waitFor: null //envVars //wait for env vars file to be written before triggering build
    });

// hash only resolves once uiBuildRes is complete.
// once we have hash we can upload ui folder to s3
    uiBucketItemsLocal = uiBuildResLocal.hash.apply((hash: string) => {
        if (!hash) {
            return [];
        }
        // recursive upload site build dir
        return folderToS3(distDir, siteBucket, "/ui");
    });
}
export const uiBuildRes = uiBuildResLocal;
export const uiBucketItems = uiBucketItemsLocal;
