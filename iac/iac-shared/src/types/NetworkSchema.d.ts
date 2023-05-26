/**
 * If you import a dependency which does not include its own type definitions,
 * TypeScript will try to find a definition for it by following the `typeRoots`
 * compiler option in tsconfig.json. For this project, we've configured it to
 * fall back to this folder if nothing is found in node_modules/@types.
 *
 * Often, you can install the DefinitelyTyped
 * (https://github.com/DefinitelyTyped/DefinitelyTyped) type definition for the
 * dependency in question. However, if no one has yet contributed definitions
 * for the package, you may want to declare your own. (If you're using the
 * `noImplicitAny` compiler options, you'll be required to declare it.)
 *
 * e.g.:
 * ```ts
 * import something from 'NetworkSchema';
 * something();
 * ```
 */
declare module 'NetworkSchema' {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    import {enums} from "@pulumi/awsx/types";

    export interface NetworkConfig {
        networkVpc: NetworkVpc;
        accounts: (AccountEntity)[];
    }

    export interface NetworkVpc {
        "us-west-2": CidrConfig;
        "us-east-1": CidrConfig;
        "eu-west-1": CidrConfig;
        "eu-west-2": CidrConfig;

        [propName: string]: CidrConfig;
    }

    export interface CidrConfig {
        vpcMainCidr: string;
        tgwCidrRoutes: (string)[];
        vmxCidrRoutes?: (string)[];
        vmxNetorkInterface?: string;
        nonprodRegionalCIDRs: (string)[];
        prodRegionalCIDRs: (string)[];
    }

    export interface AccountEntity {
        accountNum: string;
        accountName: string;
        description: string;
        regions?: (AccountConfig)[];
    }

    export enum AccountType {
        Sandbox = "SANDBOX",
        Nonprod = "NONPROD",
        Localstack = "LOCALSTACK",
        Test = "TEST",
        Uat = "UAT",
        Prod = "PROD",
    }

    export interface AccountConfig {
        region: string;
        accountType?: string;
        vpcName?: string;
        vpcConfig?: VpcConfig;
        tgwSubnetCIDR?: string;
        tgwAttachmentSubnets?: (string)[];
    }

    export interface VpcConfig {
        cidrBlock: string;
        numberOfAvailabilityZones: number;
        subnetSpecs?: (SubnetDefinition)[];
        subnetCidrMask?: number;
        enableDnsHostnames?: boolean;
        natGateways?: inputs.ec2.NatGatewayConfigurationArgs;
        tags?: any;

        [key: string]: any;
    }

    export interface SubnetDefinition {
        type: enums.ec2.SubnetType;
        name: string;
    }

}


