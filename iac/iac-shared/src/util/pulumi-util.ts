import {Config, getStack, interpolate, log, Output} from "@pulumi/pulumi";
import {getRegionOutput, Provider} from "@pulumi/aws";
import {stackEnv} from "../lib/common";

export const LOCALSTACK_ENDPOINT = process.env.LOCALSTACK_ENDPOINT;
const config = new Config();

let localstackEndpoint: string = String(LOCALSTACK_ENDPOINT);
if (localstackEndpoint === undefined)
    localstackEndpoint = "http://localstack:4566";

const endpoints = [
    {
        accessanalyzer: localstackEndpoint,
        account: localstackEndpoint,
        acm: localstackEndpoint,
        acmpca: localstackEndpoint,
        alexaforbusiness: localstackEndpoint,
        amp: localstackEndpoint,
        amplify: localstackEndpoint,
        // amplifybackend: localstackEndpoint,
        apigateway: localstackEndpoint,
        apigatewayv2: localstackEndpoint,
        // appautoscaling: localstackEndpoint,
        appconfig: localstackEndpoint,
        // appflow: localstackEndpoint,
        // appintegrations: localstackEndpoint,
        // appintegrationsservice: localstackEndpoint,
        applicationautoscaling: localstackEndpoint,
        // applicationcostprofiler: localstackEndpoint,
        // applicationdiscovery: localstackEndpoint,
        // applicationdiscoveryservice: localstackEndpoint,
        // applicationinsights: localstackEndpoint,
        // appmesh: localstackEndpoint,
        // appregistry: localstackEndpoint,
        // apprunner: localstackEndpoint,
        // appstream: localstackEndpoint,
        appsync: localstackEndpoint,
        athena: localstackEndpoint,
        // auditmanager: localstackEndpoint,
        // augmentedairuntime: localstackEndpoint,
        // autoscaling: localstackEndpoint,
        // autoscalingplans: localstackEndpoint,
        backup: localstackEndpoint,
        batch: localstackEndpoint,
        // braket: localstackEndpoint,
        // budgets: localstackEndpoint,
        // chime: localstackEndpoint,
        // cloud9: localstackEndpoint,
        // cloudcontrol: localstackEndpoint,
        // cloudcontrolapi: localstackEndpoint,
        // clouddirectory: localstackEndpoint,
        cloudformation: localstackEndpoint,
        cloudfront: localstackEndpoint,
        // cloudhsm: localstackEndpoint,
        // cloudhsmv2: localstackEndpoint,
        // cloudsearch: localstackEndpoint,
        // cloudsearchdomain: localstackEndpoint,
        cloudtrail: localstackEndpoint,
        cloudwatch: localstackEndpoint,
        //       // cloudwatchevents: localstackEndpoint,
        cloudwatchlogs: localstackEndpoint,
        // codeartifact: localstackEndpoint,
        // codebuild: localstackEndpoint,
        codecommit: localstackEndpoint,
        // codedeploy: localstackEndpoint,
        // codeguruprofiler: localstackEndpoint,
        // codegurureviewer: localstackEndpoint,
        // codepipeline: localstackEndpoint,
        // codestar: localstackEndpoint,
        // codestarconnections: localstackEndpoint,
        // codestarnotifications: localstackEndpoint,
        cognitoidentity: localstackEndpoint,
        // cognitoidentityprovider: localstackEndpoint,
        cognitoidp: localstackEndpoint,
        // cognitosync: localstackEndpoint,
        // comprehend: localstackEndpoint,
        // comprehendmedical: localstackEndpoint,
        // config: localstackEndpoint,
        // configservice: localstackEndpoint,
        // connect: localstackEndpoint,
        // connectcontactlens: localstackEndpoint,
        // connectparticipant: localstackEndpoint,
        // costandusagereportservice: localstackEndpoint,
        // costexplorer: localstackEndpoint,
        // cur: localstackEndpoint,
        // databasemigration: localstackEndpoint,
        // databasemigrationservice: localstackEndpoint,
        // dataexchange: localstackEndpoint,
        // datapipeline: localstackEndpoint,
        // datasync: localstackEndpoint,
        // dax: localstackEndpoint,
        // detective: localstackEndpoint,
        // devicefarm: localstackEndpoint,
        // devopsguru: localstackEndpoint,
        // directconnect: localstackEndpoint,
        // dlm: localstackEndpoint,
        // dms: localstackEndpoint,
        docdb: localstackEndpoint,
        // ds: localstackEndpoint,
        dynamodb: localstackEndpoint,
        dynamodbstreams: localstackEndpoint,
        ec2: localstackEndpoint,
        // ec2instanceconnect: localstackEndpoint,
        ecr: localstackEndpoint,
        // ecrpublic: localstackEndpoint,
        ecs: localstackEndpoint,
        efs: localstackEndpoint,
        eks: localstackEndpoint,
        elasticache: localstackEndpoint,
        elasticbeanstalk: localstackEndpoint,
        // elasticinference: localstackEndpoint,
        // elasticsearch: localstackEndpoint,
        elasticsearchservice: localstackEndpoint,
        // elastictranscoder: localstackEndpoint,
        elb: localstackEndpoint,
        elbv2: localstackEndpoint,
        emr: localstackEndpoint,
        // emrcontainers: localstackEndpoint,
        // es: localstackEndpoint,
        eventbridge: localstackEndpoint,
        // events: localstackEndpoint,
        // finspace: localstackEndpoint,
        // finspacedata: localstackEndpoint,
        firehose: localstackEndpoint,
        // fis: localstackEndpoint,
        // fms: localstackEndpoint,
        // forecast: localstackEndpoint,
        // forecastquery: localstackEndpoint,
        // forecastqueryservice: localstackEndpoint,
        // forecastservice: localstackEndpoint,
        // frauddetector: localstackEndpoint,
        // fsx: localstackEndpoint,
        // gamelift: localstackEndpoint,
        glacier: localstackEndpoint,
        // globalaccelerator: localstackEndpoint,
        glue: localstackEndpoint,
        // gluedatabrew: localstackEndpoint,
        // greengrass: localstackEndpoint,
        // greengrassv2: localstackEndpoint,
        // groundstation: localstackEndpoint,
        // guardduty: localstackEndpoint,
        // health: localstackEndpoint,
        // healthlake: localstackEndpoint,
        // honeycode: localstackEndpoint,
        iam: localstackEndpoint,
        // identitystore: localstackEndpoint,
        // imagebuilder: localstackEndpoint,
        // inspector: localstackEndpoint,
        iot: localstackEndpoint,
        // iot1clickdevices: localstackEndpoint,
        // iot1clickdevicesservice: localstackEndpoint,
        // iot1clickprojects: localstackEndpoint,
        iotanalytics: localstackEndpoint,
        // iotdataplane: localstackEndpoint,
        // iotdeviceadvisor: localstackEndpoint,
        // iotevents: localstackEndpoint,
        // ioteventsdata: localstackEndpoint,
        // iotfleethub: localstackEndpoint,
        // iotjobsdataplane: localstackEndpoint,
        // iotsecuretunneling: localstackEndpoint,
        // iotsitewise: localstackEndpoint,
        // iotthingsgraph: localstackEndpoint,
        // iotwireless: localstackEndpoint,
        kafka: localstackEndpoint,
        // kendra: localstackEndpoint,
        // kinesis: localstackEndpoint,
        // kinesisanalytics: localstackEndpoint,
        // kinesisanalyticsv2: localstackEndpoint,
        // kinesisvideo: localstackEndpoint,
        // kinesisvideoarchivedmedia: localstackEndpoint,
        // kinesisvideomedia: localstackEndpoint,
        // kinesisvideosignalingchannels: localstackEndpoint,
        kms: localstackEndpoint,
        lakeformation: localstackEndpoint,
        lambda: localstackEndpoint,
        // lexmodelbuilding: localstackEndpoint,
        // lexmodelbuildingservice: localstackEndpoint,
        // lexmodels: localstackEndpoint,
        // lexmodelsv2: localstackEndpoint,
        // lexruntime: localstackEndpoint,
        // lexruntimeservice: localstackEndpoint,
        // lexruntimev2: localstackEndpoint,
        // licensemanager: localstackEndpoint,
        // lightsail: localstackEndpoint,
        // location: localstackEndpoint,
        // lookoutequipment: localstackEndpoint,
        // lookoutforvision: localstackEndpoint,
        // lookoutmetrics: localstackEndpoint,
        // machinelearning: localstackEndpoint,
        // macie: localstackEndpoint,
        // macie2: localstackEndpoint,
        // managedblockchain: localstackEndpoint,
        // marketplacecatalog: localstackEndpoint,
        // marketplacecommerceanalytics: localstackEndpoint,
        // marketplaceentitlement: localstackEndpoint,
        // marketplaceentitlementservice: localstackEndpoint,
        // marketplacemetering: localstackEndpoint,
        // mediaconnect: localstackEndpoint,
        // mediaconvert: localstackEndpoint,
        // medialive: localstackEndpoint,
        // mediapackage: localstackEndpoint,
        // mediapackagevod: localstackEndpoint,
        mediastore: localstackEndpoint,
        // mediastoredata: localstackEndpoint,
        // mediatailor: localstackEndpoint,
        // memorydb: localstackEndpoint,
        // mgn: localstackEndpoint,
        // migrationhub: localstackEndpoint,
        // migrationhubconfig: localstackEndpoint,
        // mobile: localstackEndpoint,
        // mobileanalytics: localstackEndpoint,
        // mq: localstackEndpoint,
        // mturk: localstackEndpoint,
        // mwaa: localstackEndpoint,
        neptune: localstackEndpoint,
        // networkfirewall: localstackEndpoint,
        // networkmanager: localstackEndpoint,
        // nimblestudio: localstackEndpoint,
        // opsworks: localstackEndpoint,
        // opsworkscm: localstackEndpoint,
        organizations: localstackEndpoint,
        // outposts: localstackEndpoint,
        // personalize: localstackEndpoint,
        // personalizeevents: localstackEndpoint,
        // personalizeruntime: localstackEndpoint,
        // pi: localstackEndpoint,
        // pinpoint: localstackEndpoint,
        // pinpointemail: localstackEndpoint,
        // pinpointsmsvoice: localstackEndpoint,
        // polly: localstackEndpoint,
        // pricing: localstackEndpoint,
        // prometheus: localstackEndpoint,
        // prometheusservice: localstackEndpoint,
        // proton: localstackEndpoint,
        qldb: localstackEndpoint,
        // qldbsession: localstackEndpoint,
        // quicksight: localstackEndpoint,
        // ram: localstackEndpoint,
        rds: localstackEndpoint,
        rdsdata: localstackEndpoint,
        // rdsdataservice: localstackEndpoint,
        redshift: localstackEndpoint,
        redshiftdata: localstackEndpoint,
        // rekognition: localstackEndpoint,
        // resourcegroups: localstackEndpoint,
        // resourcegroupstagging: localstackEndpoint,
        // resourcegroupstaggingapi: localstackEndpoint,
        // robomaker: localstackEndpoint,
        route53: localstackEndpoint,
        route53domains: localstackEndpoint,
        route53recoverycontrolconfig: localstackEndpoint,
        route53recoveryreadiness: localstackEndpoint,
        route53resolver: localstackEndpoint,
        s3: localstackEndpoint,
        // s3control: localstackEndpoint,
        // s3outposts: localstackEndpoint,
        sagemaker: localstackEndpoint,
        // sagemakeredgemanager: localstackEndpoint,
        // sagemakerfeaturestoreruntime: localstackEndpoint,
        // sagemakerruntime: localstackEndpoint,
        // savingsplans: localstackEndpoint,
        // schemas: localstackEndpoint,
        // sdb: localstackEndpoint,
        secretsmanager: localstackEndpoint,
        // securityhub: localstackEndpoint,
        // serverlessapplicationrepository: localstackEndpoint,
        // serverlessapprepo: localstackEndpoint,
        // serverlessrepo: localstackEndpoint,
        // servicecatalog: localstackEndpoint,
        // servicediscovery: localstackEndpoint,
        // servicequotas: localstackEndpoint,
        ses: localstackEndpoint,
        // sesv2: localstackEndpoint,
        // sfn: localstackEndpoint,
        // shield: localstackEndpoint,
        // signer: localstackEndpoint,
        // simpledb: localstackEndpoint,
        // sms: localstackEndpoint,
        // snowball: localstackEndpoint,
        sns: localstackEndpoint,
        sqs: localstackEndpoint,
        ssm: localstackEndpoint,
        // ssmcontacts: localstackEndpoint,
        // ssmincidents: localstackEndpoint,
        // sso: localstackEndpoint,
        // ssoadmin: localstackEndpoint,
        // ssooidc: localstackEndpoint,
        stepfunctions: localstackEndpoint,
        // storagegateway: localstackEndpoint,
        sts: localstackEndpoint,
        // support: localstackEndpoint,
        // swf: localstackEndpoint,
        // synthetics: localstackEndpoint,
        // textract: localstackEndpoint,
        timestreamquery: localstackEndpoint,
        timestreamwrite: localstackEndpoint,
        // transcribe: localstackEndpoint,
        // transcribeservice: localstackEndpoint,
        // transcribestreaming: localstackEndpoint,
        // transcribestreamingservice: localstackEndpoint,
        transfer: localstackEndpoint,
        // translate: localstackEndpoint,
        // waf: localstackEndpoint,
        // wafregional: localstackEndpoint,
        // wafv2: localstackEndpoint,
        // wellarchitected: localstackEndpoint,
        // workdocs: localstackEndpoint,
        // worklink: localstackEndpoint,
        // workmail: localstackEndpoint,
        // workmailmessageflow: localstackEndpoint,
        // workspaces: localstackEndpoint,
        xray: localstackEndpoint,
    },
];

export class PulumiUtil {
    public awsProvider: Provider;
    public east1Provider: Provider;
    public env: string;
    public isLocal: boolean;
    public host: string;
    public region: Output<string>;
    public loggingLevel: string;
    public auth0Audience: string;
    public auth0ClientId: string;
    public auth0Domain: string;
    public appVersion: string;
    private static pulumiUtil: PulumiUtil;

    isActive(profile: string): boolean {
        let profilesActive = config.get("profiles") as string;
        log.info(`profilesActive: ${profilesActive}`);
        if (profilesActive === undefined) return false;
        return profilesActive.includes(profile);
    }

    static instance(): PulumiUtil {
        if (this.pulumiUtil) {
            return this.pulumiUtil;
        } else {
            this.pulumiUtil = new PulumiUtil();
        }
        return this.pulumiUtil;
    }


    constructor() {
        this.loggingLevel = config.require("logging_level");
        this.auth0Audience = config.require("auth0_audience");
        this.auth0ClientId = config.require("auth0_client_id");
        this.auth0Domain = config.require("auth0_domain");
        this.appVersion = config.require("app_version");
        if (!stackEnv.endsWith("local")) {
            log.info("Using AWS");

            this.isLocal = false;
            this.host = '';
            this.region = getRegionOutput().name;
            this.awsProvider = new Provider("aws", {});
            this.east1Provider = new Provider("aws-ea-provider", {
                region: "us-east-1",
            });
        } else {
            log.info("Using Localstack");

            this.isLocal = true;
            this.region = interpolate`us-west-2`;
            this.host = localstackEndpoint;
            this.awsProvider = new Provider("localstack", {
                skipCredentialsValidation: true,
                skipMetadataApiCheck: true,
                skipRequestingAccountId: true,
                s3UsePathStyle: true,
                sharedCredentialsFiles: [".aws/credentials"],
                sharedConfigFiles: [".aws/config"],
                accessKey: "test",
                secretKey: "test",
                region: "us-west-2",
                //    profile: 'localstack',
                // list of supported features
                // https://docs.localstack.cloud/aws/feature-coverage/
                // list of feature status
                // https://app.localstack.cloud/status
                endpoints: endpoints,
            });
            this.east1Provider = this.awsProvider;
        }
        let stackPieces: string[] = getStack().split(".");
        this.env = stackPieces[stackPieces.length - 1];
    }
}


