import { Provider } from '@pulumi/aws';
import { Output } from '@pulumi/pulumi';
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { mkItemName, mkTagsWithName, toNativeTags } from './common';
import { PulumiUtil } from '../util/pulumi-util';
import { folderFileList, normalizePath } from './utils';

const mime = require('mime');

/***
 * Remap given path to a new path. Used to translate local path to bucket path.
 * @param dirBase Local filesystem path.
 * @param keyBase S3 Key to remap to.
 */
export const remapPathToS3 = (dirBase: string, keyBase: string) => {
  dirBase = normalizePath(dirBase);
  return folderFileList(dirBase)
    .map(normalizePath)
    .map((p) => {
      let key = p.replace(dirBase, keyBase);
      pulumi.log.info(`Path: ${p} Key: ${key}`);
      return {path: p, key: key};
    });
};
/***
 * Recurse given folder and replicate structure in s3 starting at specified key.
 * @param dir Folder where all objects are located.
 * @param bucket S3 bucket for objects.
 * @param key S3 key prefix to put files. Defaults to no prefix.
 */
export const folderToS3 = (
  dir: string,
  bucket: aws.s3.Bucket,
  key: string = ''
): aws.s3.BucketObject[] => {
  if (PulumiUtil.instance().isLocal) {
    return [];
  }
  return remapPathToS3(dir, key).map(
    (item) =>
      new aws.s3.BucketObject(
        mkItemName(item.key),
        {
          bucket: bucket,
          key: item.key,
          source: new pulumi.asset.FileAsset(item.path),
          contentType: mime.getType(item.path) || undefined,
          tags: mkTagsWithName(item.key)
        },
        {provider: PulumiUtil.instance().awsProvider}
      )
  );
};
/***
 * Creates a cloudwatch log group
 * @param name
 * @param retentionInDays default retention period in days. Defaults to 3 days.
 */
export const mkLogGroup = (
  name: string,
  retentionInDays: number = 3
): aws.cloudwatch.LogGroup => {
  return new aws.cloudwatch.LogGroup(
    name,
    {
      retentionInDays,
      tags: mkTagsWithName(name)
    },
    {provider: PulumiUtil.instance().awsProvider}
  );
};

/***
 * Used to grant cf access to s3 bucket
 * @param name
 */
export const getOriginAccessIdentity = (
  name: string
): aws.cloudfront.OriginAccessIdentity => {
  return new aws.cloudfront.OriginAccessIdentity(
    mkItemName(name + '-oai'),
    {},
    {
      provider: PulumiUtil.instance().awsProvider
    }
  );
};


export interface ExportParameterArgs {
  buildType?: string;
  appPrefix?: string;
  appVersion?: string;
  component: string;
  attribute: string;
  value: string | Output<string>;
  type?: 'String' | 'StringList' | 'SecureString';
}

export const exportParameter = (args: ExportParameterArgs, provider: Provider): aws.ssm.Parameter => {
  let buildType = args.buildType ? args.buildType : (PulumiUtil.instance().isLocal ? 'local' : 'aws');
  let appPrefix = args.appPrefix ? args.appPrefix : 'app';
  let appVersion = args.appVersion ? args.appVersion : 'v1';
  let paramType = args.type ? args.type : 'String';

  return new aws.ssm.Parameter(
    mkItemName(`${appPrefix}-${args.component}-${args.attribute}`),
    {
      name: `/${buildType}/${appPrefix}/${appVersion}/${args.component}/${args.attribute}`,
      value: args.value,
      type: paramType,
      tier: 'Intelligent-Tiering',
      overwrite: true,
      tags: {
        'build-type': buildType,
        'app-prefix': appPrefix,
        'app-version': appVersion,
        'component': args.component,
        'attribute': args.attribute
      }
    },
    {provider});
};


export interface ImportParameterArgs {
  buildType?: string;
  appPrefix?: string;
  appVersion?: string;
  component: string;
  attribute: string;
}

export const importParameters = (args: ImportParameterArgs, provider: Provider): Output<string> => {
  let buildType = args.buildType ? args.buildType : (PulumiUtil.instance().isLocal ? 'local' : 'cloud');
  let appPrefix = args.appPrefix ? args.appPrefix : 'app';
  let appVersion = args.appVersion ? args.appVersion : 'v1';
  let path = `/${buildType}/${appPrefix}/${appVersion}/${args.component}/${args.attribute}`;
  pulumi.log.info(`!!!!!!!!!!!!!!!!!!!!!! ${path} !!!!!!!!!!!!!!!!!!!!!!`);
  const temp = aws.ssm.getParameterOutput(
    {
      name: path,
      // recursive: true,
      withDecryption: true
    },
    {provider}
  );
  temp.apply((v) => pulumi.log.info(`!!!!!!!!!!!!!!!!!!!!!!!!! ${JSON.stringify(v)} !!!!!!!!!!!!!!!!!!!!!!!!!`));
  return temp.value;
};
