import type { DocumentRecord } from "../types/document";

export interface IDocumentsRepository {
  save(record: DocumentRecord): Promise<void>;
  findAll(): Promise<DocumentRecord[]>;
}

class InMemoryDocumentsRepository implements IDocumentsRepository {
  private documents = new Map<string, DocumentRecord>();

  async save(record: DocumentRecord): Promise<void> {
    this.documents.set(record.documentId, record);
  }

  async findAll(): Promise<DocumentRecord[]> {
    return Array.from(this.documents.values()).sort(
      (a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
    );
  }
}

export const documentsRepository: IDocumentsRepository =
  new InMemoryDocumentsRepository();
