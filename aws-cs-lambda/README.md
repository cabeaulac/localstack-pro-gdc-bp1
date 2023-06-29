# AWS C# Lambda
This example creates an AWS Lambda function that does a simple `.ToUpper` on the string input and returns it. 

## Deploying the App

To deploy your infrastructure, follow the steps below.

### Prerequisites

1. [Install Pulumi](https://www.pulumi.com/docs/get-started/install/)
2. [Configure AWS Credentials](https://www.pulumi.com/docs/intro/cloud-providers/aws/setup/)

### Steps

After cloning this repo, from this working directory, run these commands:

1. Build and publish the lambda function, making the output available to our Pulumi program. 

    ```bash
    dotnet publish ./DotnetLambda/src/DotnetLambda/
    ```

2. Execute our Pulumi program to archive our published function output, and create our lambda. 

    ```bash
    pulumi up -C ./pulumi
    ```
   OR

    ```bash
    pulumi up -C ./pulumi-node
    ```


3. Call our Lambda function from the AWS CLI with "foo" as the payload.

    ```bash
    aws lambda invoke \
    --function-name $(pulumi stack output Lambda -C ./pulumi) \
    --region $(pulumi config get aws:region -C ./pulumi) \
    --cli-binary-format raw-in-base64-out \
    --payload '"foo"' \
    output.json

    cat output.json # view the output file with your tool of choice
    # "FOO"
    ```

6. From there, feel free to experiment. Simply making edits, rebuilding your handler, and running `pulumi up` will update your function.

7. Afterwards, destroy your stack and remove it:

    ```bash
    pulumi destroy --yes
    pulumi stack rm --yes
    ```


# Hot Reload Setup

## Prerequisites Without GDC
1. You have LocalStack running
2. You have dotnet6 installed
3. Create a pyenv and source it
```shell
make setup-venv
source venv/bin/activate
```
4. Set this python venv as your venv for PyCharm (optional)

If you're using PyCharm, you can just open this README in preview mode and click on the bash steps below.


## Dotnet Lambda Hot Reload
1. Publish code from laptop 

Doing this part from the laptop in order to publish the dotnet Lambda to a directory that is bind mountable by 
DockerDesktop containers. This is needed because we'll then deploy the Lambda in hot-deploy mode to LocalStack.
When LocalStack launches the Lambda, it will bind-mount the directory.
This example is running DockerDesktop on a Mac ARM processor. Notice the `-r linux-arm64` below.
Change this to `-r linux-x64` if you are on an intel architecture.

From the aws-cs-lambda dir. Or you can just click on this in the README from PyCharm.
```shell
 dotnet publish ./DotnetLambda/src/DotnetLambda/ \
 --output /tmp/hot-reload/lambdas/dotnetlambda \
 --self-contained false \
 -r linux-arm64
```

2. Deploy to LocalStack
This example is running DockerDesktop on a Mac ARM processor. Notice the `--architecture arm64` below.
Remove the `--architecture` flag entirely if you are on an intel architecture.

```shell
awslocal lambda create-function --function-name dotnetfunction \
--code S3Bucket="hot-reload",S3Key="/tmp/hot-reload/lambdas/dotnetlambda" \
--handler DotnetLambda::DotnetLambda.Function::FunctionHandler \
--runtime dotnet6 \
--architecture arm64 \
--role arn:aws:iam::000000000000:role/lambda-role
```

3. Test Invoke

```shell
awslocal lambda invoke --function-name dotnetfunction \
--cli-binary-format raw-in-base64-out \
--payload '"Working with LocalStack is Fun"' output.txt
```