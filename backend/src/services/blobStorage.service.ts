import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName =
  process.env.AZURE_STORAGE_CONTAINER ?? "clinical-documents";

if (!connectionString) {
  throw new Error("AZURE_STORAGE_CONNECTION_STRING is not set.");
}

const blobServiceClient =
  BlobServiceClient.fromConnectionString(connectionString);

let containerClientPromise: Promise<ContainerClient> | undefined;

function getContainerClient(): Promise<ContainerClient> {
  if (!containerClientPromise) {
    containerClientPromise = (async () => {
      const containerClient =
        blobServiceClient.getContainerClient(containerName);
      await containerClient.createIfNotExists();
      return containerClient;
    })();
  }
  return containerClientPromise;
}

export interface UploadedBlob {
  blobName: string;
  url: string;
  contentType: string;
  size: number;
}

export async function uploadDocumentBlob(
  blobName: string,
  buffer: Buffer,
  contentType: string,
): Promise<UploadedBlob> {
  const containerClient = await getContainerClient();
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: contentType },
  });

  return {
    blobName,
    url: blockBlobClient.url,
    contentType,
    size: buffer.length,
  };
}
