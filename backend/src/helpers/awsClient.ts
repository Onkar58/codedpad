import { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { configDotenv } from "dotenv";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  PutCommand,
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
  UpdateCommandInput,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

configDotenv();

console.log({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
const clientCredentials = {
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  region: process.env.AWS_REGION!,
};
export const s3Client = new S3Client(clientCredentials);

export async function generateUploadUrl(key: string, contentType: any) {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  return await getSignedUrl(s3Client, command, { expiresIn: 60 * 5 }); // 5 min
}

export async function generateDownloadUrl(key: string) {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    ResponseContentDisposition: "attachment",
  });

  return await getSignedUrl(s3Client, command, { expiresIn: 60 * 10 }); // 10 min
}

export const dynamoDBClient = new DynamoDBClient(clientCredentials);
const docClient = DynamoDBDocumentClient.from(dynamoDBClient);
const TABLE_NAME = "codedpad-metadata";

export async function getFilesByCode(code: string) {
  const params = {
    TableName: TABLE_NAME,
    Key: { code },
  };

  const result = await docClient.send(new GetCommand(params));

  if (!result.Item) {
    return null; // or [] if you prefer empty array
  }

  return result.Item.files || [];
}

export async function addOrAppendFiles(
  code: string,
  newFiles: Array<{
    name: string;
    type: string;
    size: number;
    key: string;
  }>,
) {
  const params: UpdateCommandInput = {
    TableName: TABLE_NAME,
    Key: { code },
    UpdateExpression: `
      SET files = list_append(
        if_not_exists(files, :emptyList), 
        :newFiles
      )
    `,
    ExpressionAttributeValues: {
      ":newFiles": newFiles,
      ":emptyList": [],
    },
    ReturnValues: "ALL_NEW",
  };

  const result = await docClient.send(new UpdateCommand(params));
  return result.Attributes;
}

export async function removeFileByIndex(code: string, fileIndex: number) {
  const params: UpdateCommandInput = {
    TableName: TABLE_NAME,
    Key: { code },
    UpdateExpression: `REMOVE files[${fileIndex}]`,
    ReturnValues: "ALL_NEW",
  };

  const result = await docClient.send(new UpdateCommand(params));
  return result.Attributes;
}

export async function deleteItem(code: string) {
  const params = {
    TableName: TABLE_NAME,
    Key: { code },
  };

  await docClient.send(new DeleteCommand(params));
  return { success: true };
}
