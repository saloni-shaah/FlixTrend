export interface FirestorePermissionErrorDetails {
  path: string;
  operation: 'read' | 'write' | 'delete';
  requestResourceData?: any;
}

export class FirestorePermissionError extends Error {
  details: FirestorePermissionErrorDetails;

  constructor(details: FirestorePermissionErrorDetails) {
    const message = `Firestore Permission Denied: Cannot ${details.operation} on '${details.path}'.`;
    super(message);
    this.name = 'FirestorePermissionError';
    this.details = details;
  }
}
