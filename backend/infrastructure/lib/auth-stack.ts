import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

export class AuthStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create DynamoDB table
    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production
    });

    // Create Lambda functions
    const loginFunction = new lambda.Function(this, 'LoginFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'login.handler',
      code: lambda.Code.fromAsset('../src/auth'),
      environment: {
        USERS_TABLE: usersTable.tableName,
        JWT_SECRET: 'your-secret-key', // Use AWS Secrets Manager in production
      },
    });

    const registerFunction = new lambda.Function(this, 'RegisterFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'register.handler',
      code: lambda.Code.fromAsset('../src/auth'),
      environment: {
        USERS_TABLE: usersTable.tableName,
      },
    });

    // Grant permissions to Lambda functions
    usersTable.grantReadWriteData(loginFunction);
    usersTable.grantReadWriteData(registerFunction);

    // Create API Gateway
    const api = new apigateway.RestApi(this, 'AuthApi', {
      restApiName: 'Auth Service',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // Add resources and methods
    const auth = api.root.addResource('auth');
    const login = auth.addResource('login');
    const register = auth.addResource('register');

    login.addMethod('POST', new apigateway.LambdaIntegration(loginFunction));
    register.addMethod('POST', new apigateway.LambdaIntegration(registerFunction));
  }
}
